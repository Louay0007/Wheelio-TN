"use client"

import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

export const fieldInputClass =
  "h-11 w-full rounded-[7px] border border-black/15 bg-transparent px-3 text-sm dark:border-white/15"

type PasswordFieldsProps = {
  passwordName?: string
  confirmName?: string
  passwordLabel?: string
  confirmLabel?: string
  showConfirm?: boolean
  showStrength?: boolean
  passwordValue?: string
  onPasswordChange?: (value: string) => void
  autoComplete?: "new-password" | "current-password"
  required?: boolean
}

function strengthHint(password: string): { label: string; tone: string } | null {
  if (!password) return null
  if (password.length < 8) {
    return { label: "Use at least 8 characters", tone: "text-black/50 dark:text-white/50" }
  }
  const hasMix =
    /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)
  if (!hasMix) {
    return {
      label: "Add upper, lower, and a number for a stronger password",
      tone: "text-black/55 dark:text-white/55",
    }
  }
  return { label: "Looks good", tone: "text-black/45 dark:text-white/45" }
}

export function PasswordFields({
  passwordName = "password",
  confirmName = "passwordConfirm",
  passwordLabel = "Password",
  confirmLabel = "Confirm password",
  showConfirm = false,
  showStrength = false,
  passwordValue: controlledPassword,
  onPasswordChange,
  autoComplete = "new-password",
  required = true,
}: PasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmField, setShowConfirmField] = useState(false)
  const [internalPassword, setInternalPassword] = useState("")
  const hintId = useId()

  const password = controlledPassword ?? internalPassword
  const hint = showStrength ? strengthHint(password) : null

  return (
    <>
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">{passwordLabel}</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name={passwordName}
            autoComplete={autoComplete}
            required={required}
            placeholder="••••••••"
            className={cn(fieldInputClass, "pr-11")}
            value={controlledPassword}
            onChange={(e) => {
              if (onPasswordChange) onPasswordChange(e.target.value)
              else setInternalPassword(e.target.value)
            }}
            aria-describedby={hint ? hintId : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-1.5 text-black/45 hover:text-black dark:text-white/45 dark:hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        </div>
        {hint ? (
          <p id={hintId} className={cn("text-xs", hint.tone)}>
            {hint.label}
          </p>
        ) : null}
      </label>

      {showConfirm ? (
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">{confirmLabel}</span>
          <div className="relative">
            <input
              type={showConfirmField ? "text" : "password"}
              name={confirmName}
              autoComplete="new-password"
              required={required}
              placeholder="••••••••"
              className={cn(fieldInputClass, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmField((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[6px] p-1.5 text-black/45 hover:text-black dark:text-white/45 dark:hover:text-white"
              aria-label={showConfirmField ? "Hide password" : "Show password"}
            >
              {showConfirmField ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </label>
      ) : null}
    </>
  )
}
