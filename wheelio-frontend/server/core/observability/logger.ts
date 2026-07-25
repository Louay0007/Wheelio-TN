import pino from "pino"
import { getEnv } from "@/server/core/env"

let logger: pino.Logger | null = null

export function getLogger() {
  if (logger) return logger
  const env = getEnv()
  logger = pino({
    level: env.LOG_LEVEL,
    base: {
      service: "wheelio-web",
      env: env.NODE_ENV,
    },
    redact: {
      paths: [
        "password",
        "token",
        "authorization",
        "cookie",
        "iban",
        "licenseNumber",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      remove: true,
    },
  })
  return logger
}
