import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://wheelio:wheelio@localhost:5433/wheelio"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6380"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("dev-only-change-me-wheelio-tn-secret-key-32"),
  BETTER_AUTH_URL: z.string().url().optional(),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9010),
  MINIO_USE_SSL: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  MINIO_ACCESS_KEY: z.string().default("wheelio"),
  MINIO_SECRET_KEY: z.string().default("wheelio-secret"),
  MINIO_PUBLIC_BUCKET: z.string().default("wheelio-public"),
  MINIO_PRIVATE_BUCKET: z.string().default("wheelio-private"),
  MINIO_QUARANTINE_BUCKET: z.string().default("wheelio-quarantine"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1125),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Wheelio TN <noreply@wheelio.tn>"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
  PAYMENT_WEBHOOK_SECRET: z
    .string()
    .min(16)
    .default("dev-only-payment-webhook-secret"),
})

export type AppEnv = z.infer<typeof envSchema>

let cached: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")
    throw new Error(`Invalid environment: ${details}`)
  }
  cached = parsed.data
  return cached
}

export function resetEnvCache() {
  cached = null
}
