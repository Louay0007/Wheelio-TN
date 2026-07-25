import type { ErrorCode } from "@/server/contracts/common"

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: Record<string, unknown>
  readonly expose: boolean

  constructor(opts: {
    code: ErrorCode
    message: string
    status: number
    details?: Record<string, unknown>
    expose?: boolean
    cause?: unknown
  }) {
    super(opts.message, { cause: opts.cause })
    this.name = "AppError"
    this.code = opts.code
    this.status = opts.status
    this.details = opts.details
    this.expose = opts.expose ?? opts.status < 500
  }
}

export function notFound(message = "Resource not found", details?: Record<string, unknown>) {
  return new AppError({
    code: "NOT_FOUND",
    message,
    status: 404,
    details,
  })
}

export function unauthorized(message = "Authentication required") {
  return new AppError({
    code: "AUTH_REQUIRED",
    message,
    status: 401,
  })
}

export function forbidden(
  code: ErrorCode = "FORBIDDEN",
  message = "You do not have permission to perform this action",
  details?: Record<string, unknown>,
) {
  return new AppError({
    code,
    message,
    status: 403,
    details,
  })
}

export function validationError(
  message: string,
  details?: Record<string, unknown>,
) {
  return new AppError({
    code: "VALIDATION_ERROR",
    message,
    status: 422,
    details,
  })
}

export function conflict(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return new AppError({
    code,
    message,
    status: 409,
    details,
  })
}

export function internalError(message = "Unexpected server error", cause?: unknown) {
  return new AppError({
    code: "INTERNAL_ERROR",
    message,
    status: 500,
    expose: false,
    cause,
  })
}
