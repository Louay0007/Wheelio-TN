"use client";

import { ApiErrorState } from "@/components/api/api-state";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ApiErrorState error={error} retry={reset} />;
}
