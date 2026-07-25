import { getAuth } from "@/server/core/auth/config"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(getAuth())
