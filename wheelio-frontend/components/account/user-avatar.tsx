import { userInitials, type DemoUser } from "@/lib/user"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
  user: Pick<DemoUser, "name" | "preferredName">
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClass = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-base",
} as const

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const initials = userInitials(user)
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full border border-black/15 bg-black/[0.04] font-semibold tracking-[-0.02em] text-black dark:border-white/15 dark:bg-white/[0.06] dark:text-white",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
