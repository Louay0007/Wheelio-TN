import { NextResponse } from "next/server"
import { ZodError } from "zod"
import type { PageMeta } from "@/server/contracts/pagination"
import { AppError } from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { getLogger } from "@/server/core/observability/logger"

export function jsonOk<T>(
  data: T,
  ctx: RequestContext,
  init?: { status?: number; headers?: HeadersInit; etag?: string },
) {
  const headers = new Headers(init?.headers)
  headers.set("X-Request-Id", ctx.requestId)
  headers.set("X-Correlation-Id", ctx.correlationId)
  if (init?.etag) headers.set("ETag", init.etag)
  return NextResponse.json(
    {
      data,
      meta: {
        requestId: ctx.requestId,
        locale: ctx.locale,
      },
    },
    { status: init?.status ?? 200, headers },
  )
}

export function jsonCreated<T>(
  data: T,
  ctx: RequestContext,
  location?: string,
) {
  const headers: HeadersInit = {}
  if (location) headers.Location = location
  return jsonOk(data, ctx, { status: 201, headers })
}

export function jsonCollection<T>(
  data: T[],
  page: PageMeta,
  ctx: RequestContext,
) {
  const headers = new Headers()
  headers.set("X-Request-Id", ctx.requestId)
  headers.set("X-Correlation-Id", ctx.correlationId)
  return NextResponse.json(
    {
      data,
      page,
      meta: {
        requestId: ctx.requestId,
        locale: ctx.locale,
      },
    },
    { status: 200, headers },
  )
}

export function jsonNoContent(ctx: RequestContext) {
  const headers = new Headers()
  headers.set("X-Request-Id", ctx.requestId)
  headers.set("X-Correlation-Id", ctx.correlationId)
  return new NextResponse(null, { status: 204, headers })
}

export function jsonError(error: unknown, ctx: RequestContext) {
  const log = getLogger()
  if (error instanceof AppError) {
    if (!error.expose) {
      log.error({ err: error, requestId: ctx.requestId }, error.message)
    }
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.expose ? error.message : "Unexpected server error",
          details: error.expose ? error.details ?? {} : {},
          requestId: ctx.requestId,
        },
      },
      {
        status: error.status,
        headers: {
          "X-Request-Id": ctx.requestId,
          "X-Correlation-Id": ctx.correlationId,
        },
      },
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: { issues: error.issues },
          requestId: ctx.requestId,
        },
      },
      {
        status: 422,
        headers: {
          "X-Request-Id": ctx.requestId,
          "X-Correlation-Id": ctx.correlationId,
        },
      },
    )
  }

  log.error({ err: error, requestId: ctx.requestId }, "Unhandled API error")
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
        details: {},
        requestId: ctx.requestId,
      },
    },
    {
      status: 500,
      headers: {
        "X-Request-Id": ctx.requestId,
        "X-Correlation-Id": ctx.correlationId,
      },
    },
  )
}
