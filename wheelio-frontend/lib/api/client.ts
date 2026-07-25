import { z } from "zod"
import {
  apiCollectionEnvelopeSchema,
  apiEnvelopeSchema,
  apiErrorEnvelopeSchema,
  type ApiMeta,
  type ApiPage,
} from "@/lib/contracts/common"

export type ApiErrorBody = z.infer<typeof apiErrorEnvelopeSchema>

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>
  readonly requestId?: string

  constructor(
    status: number,
    body: ApiErrorBody["error"],
    options?: ErrorOptions,
  ) {
    super(body.message)
    this.name = "ApiClientError"
    this.cause = options?.cause
    this.status = status
    this.code = body.code
    this.details = body.details ?? {}
    this.requestId = body.requestId
  }
}

type ApiRequestInit<T> = Omit<RequestInit, "body"> & {
  json?: unknown
  body?: BodyInit | null
  schema?: z.ZodType<T>
  timeoutMs?: number
  idempotencyKey?: string
}

export type ApiResult<T> = {
  data: T
  meta: ApiMeta
}

export type ApiCollectionResult<T> = ApiResult<T[]> & {
  page: ApiPage
}

function activeLocale() {
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang
    if (lang === "fr") return "fr"
  }
  return "en"
}

function fallbackError(status: number, requestId?: string) {
  return {
    code: status === 401 ? "AUTH_REQUIRED" : "INTERNAL_ERROR",
    message:
      status === 401
        ? "Authentication is required."
        : "The request could not be completed.",
    requestId,
  }
}

async function parsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    throw new ApiClientError(
      response.ok ? 502 : response.status,
      {
        code: "INVALID_API_RESPONSE",
        message: "The API returned a non-JSON response.",
        requestId: response.headers.get("x-request-id") ?? undefined,
      },
    )
  }
  try {
    return await response.json()
  } catch (cause) {
    throw new ApiClientError(
      response.ok ? 502 : response.status,
      {
        code: "INVALID_API_RESPONSE",
        message: "The API returned malformed JSON.",
        requestId: response.headers.get("x-request-id") ?? undefined,
      },
      { cause },
    )
  }
}

async function execute<T>(path: string, init?: ApiRequestInit<T>) {
  const headers = new Headers(init?.headers)
  if (init?.json !== undefined) headers.set("Content-Type", "application/json")
  if (!headers.has("Accept")) headers.set("Accept", "application/json")
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", activeLocale())
  }
  if (!headers.has("X-Request-Id")) headers.set("X-Request-Id", crypto.randomUUID())
  if (init?.idempotencyKey) {
    headers.set("Idempotency-Key", init.idempotencyKey)
  }

  const timeoutSignal = AbortSignal.timeout(init?.timeoutMs ?? 15_000)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal

  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers,
      signal,
      credentials: "include",
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    })
  } catch (cause) {
    if (cause instanceof ApiClientError) throw cause
    const aborted = signal.aborted
    throw new ApiClientError(
      0,
      {
        code: "TEMPORARY_UNAVAILABLE",
        message: aborted
          ? "The request timed out or was cancelled."
          : "The API is temporarily unavailable.",
      },
      { cause },
    )
  }

  if (response.status === 204) return { response, payload: undefined }
  const payload = await parsePayload(response)
  if (!response.ok) {
    const parsed = apiErrorEnvelopeSchema.safeParse(payload)
    throw new ApiClientError(
      response.status,
      parsed.success
        ? parsed.data.error
        : fallbackError(
            response.status,
            response.headers.get("x-request-id") ?? undefined,
          ),
    )
  }
  return { response, payload }
}

export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: ApiRequestInit<T>,
): Promise<ApiResult<T>> {
  const { response, payload } = await execute(path, init)
  if (response.status === 204) {
    return { data: undefined as T, meta: { requestId: "" } }
  }
  const parsed = apiEnvelopeSchema(schema).safeParse(payload)
  if (!parsed.success) {
    throw new ApiClientError(
      502,
      {
        code: "INVALID_API_RESPONSE",
        message: "The API response did not match its contract.",
        details: { issues: parsed.error.issues },
        requestId: response.headers.get("x-request-id") ?? undefined,
      },
      { cause: parsed.error },
    )
  }
  return parsed.data
}

export async function apiFetch<T>(
  path: string,
  init?: ApiRequestInit<T>,
): Promise<T> {
  if (init?.schema) return (await apiRequest(path, init.schema, init)).data
  const { response, payload } = await execute(path, init)
  if (response.status === 204) return undefined as T
  const envelope = z
    .object({ data: z.unknown(), meta: z.unknown().optional() })
    .safeParse(payload)
  if (!envelope.success) {
    throw new ApiClientError(502, {
      code: "INVALID_API_RESPONSE",
      message: "The API response did not include a data envelope.",
    })
  }
  return envelope.data.data as T
}

export async function apiFetchPage<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: ApiRequestInit<T[]>,
): Promise<ApiCollectionResult<T>> {
  const { response, payload } = await execute(path, init)
  const parsed = apiCollectionEnvelopeSchema(schema).safeParse(payload)
  if (!parsed.success) {
    throw new ApiClientError(
      502,
      {
        code: "INVALID_API_RESPONSE",
        message: "The API collection response did not match its contract.",
        details: { issues: parsed.error.issues },
        requestId: response.headers.get("x-request-id") ?? undefined,
      },
      { cause: parsed.error },
    )
  }
  return parsed.data
}

export async function apiFetchCollection<T>(
  path: string,
  init?: ApiRequestInit<T[]> & { itemSchema?: z.ZodType<T> },
): Promise<T[]> {
  if (init?.itemSchema) {
    return (await apiFetchPage(path, init.itemSchema, init)).data
  }
  const { payload } = await execute(path, init)
  const envelope = z.object({ data: z.array(z.unknown()) }).safeParse(payload)
  if (!envelope.success) {
    throw new ApiClientError(502, {
      code: "INVALID_API_RESPONSE",
      message: "The API response did not include a collection envelope.",
    })
  }
  return envelope.data.data as T[]
}
