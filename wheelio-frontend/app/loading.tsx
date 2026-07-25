import { ApiLoadingState } from "@/components/api/api-state"

export default function RootLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <ApiLoadingState label="Loading Wheelio…" />
    </main>
  )
}
