import nodemailer from "nodemailer"
import { getEnv } from "@/server/core/env"
import { getLogger } from "@/server/core/observability/logger"

export type SendEmailInput = {
  to: string
  subject: string
  text: string
  html?: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter
  const env = getEnv()
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  })
  return transporter
}

export async function sendEmail(input: SendEmailInput) {
  const env = getEnv()
  const log = getLogger()
  try {
    const info = await getTransporter().sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    log.info({ messageId: info.messageId, to: input.to }, "Email sent")
    return info
  } catch (error) {
    log.error({ err: error, to: input.to }, "Email send failed")
    if (env.NODE_ENV === "production") throw error
    log.warn("Continuing without email delivery in non-production")
    return null
  }
}
