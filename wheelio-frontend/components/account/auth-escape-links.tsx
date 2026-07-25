import Link from "next/link"
import { cn } from "@/lib/utils"

type AuthEscapeLinksProps = {
  mode: "login" | "signup"
  className?: string
}

export function AuthEscapeLinks({ mode, className }: AuthEscapeLinksProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-sm leading-relaxed text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60">
        You can book without an account.{" "}
        <Link href="/search" className="font-medium underline underline-offset-4">
          Continue as guest
        </Link>{" "}
        — checkout never requires signing in.
      </p>
      <p className="text-center text-sm text-black/50 dark:text-white/50">
        <Link
          href="/bookings/find"
          className="font-medium underline underline-offset-4"
        >
          Find a booking
        </Link>
        {mode === "login" ? (
          <>
            {" · "}
            No account?{" "}
            <Link href="/signup" className="font-medium underline underline-offset-4">
              Sign up
            </Link>
          </>
        ) : (
          <>
            {" · "}
            Already registered?{" "}
            <Link href="/login" className="font-medium underline underline-offset-4">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  )
}
