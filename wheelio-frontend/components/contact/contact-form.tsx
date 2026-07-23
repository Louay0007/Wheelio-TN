"use client"

import { useState, type FormEvent } from "react"

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent">("idle")

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Frontend-only: no backend wired yet
    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="rounded-[8px] border border-black/15 px-5 py-6 dark:border-white/15">
        <p className="text-base font-medium">Message recorded</p>
        <p className="mt-2 text-sm leading-relaxed text-black/55 dark:text-white/55">
          Thanks — this demo form does not send email yet. For a real request,
          write to{" "}
          <a href="mailto:support@wheelio.tn" className="underline-offset-2 hover:underline">
            support@wheelio.tn
          </a>{" "}
          or use WhatsApp during desk hours.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-medium underline-offset-2 hover:underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Full name" htmlFor="name" required>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className={inputClass}
        />
      </Field>
      <Field label="Email" htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Field
        label="Booking reference"
        htmlFor="bookingRef"
        hint="Optional — helps us find your trip faster"
      >
        <input
          id="bookingRef"
          name="bookingRef"
          autoComplete="off"
          placeholder="e.g. WH-123456"
          className={inputClass}
        />
      </Field>
      <Field label="Message" htmlFor="message" required>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${inputClass} min-h-[120px] resize-y py-3`}
        />
      </Field>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-[7px] bg-black px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Send message
      </button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="text-black/40 dark:text-white/40"> *</span> : null}
      </label>
      {hint ? (
        <p className="mt-0.5 text-xs text-black/45 dark:text-white/45">{hint}</p>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  )
}

const inputClass =
  "h-11 w-full rounded-[7px] border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-black dark:border-white/15 dark:bg-zinc-950 dark:focus:border-white"
