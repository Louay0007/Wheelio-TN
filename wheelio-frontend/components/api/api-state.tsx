"use client";

import Link from "next/link";
import { AlertCircle, LoaderCircle, LockKeyhole } from "lucide-react";
import { ApiClientError } from "@/lib/api/client";

export function ApiLoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-36 items-center justify-center gap-2 text-sm text-black/55 dark:text-white/55"
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ApiEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 p-8 text-center dark:border-white/15">
      <h2 className="font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-black/55 dark:text-white/55">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ApiErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const apiError = error instanceof ApiClientError ? error : null;
  const needsAuth = apiError?.status === 401;
  const forbidden = apiError?.status === 403;
  const conflict = apiError?.code === "VERSION_CONFLICT";
  const needsMfa = apiError?.code === "MFA_REQUIRED";
  const needsStepUp = apiError?.code === "STEP_UP_REQUIRED";
  const rateLimited =
    apiError?.code === "RATE_LIMITED" || apiError?.status === 429;

  return (
    <div
      className="rounded-lg border border-red-500/20 bg-red-500/5 p-6"
      role="alert"
    >
      <div className="flex items-start gap-3">
        {needsAuth || forbidden ? (
          <LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        )}
        <div>
          <h2 className="font-semibold">
            {needsAuth
              ? "Sign in required"
              : needsMfa
                ? "Two-factor verification required"
                : needsStepUp
                  ? "Confirm your identity"
                  : conflict
                    ? "This information changed"
                    : rateLimited
                      ? "Too many attempts"
                      : forbidden
                        ? "You do not have access"
                        : "We couldn’t load this data"}
          </h2>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {apiError?.message ?? "Please try again in a moment."}
          </p>
          {apiError?.requestId ? (
            <p className="mt-2 font-mono text-xs text-black/40 dark:text-white/40">
              Request {apiError.requestId}
            </p>
          ) : null}
          <div className="mt-4 flex gap-3">
            {needsAuth ? (
              <Link
                href="/login"
                className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Sign in
              </Link>
            ) : null}
            {needsMfa || needsStepUp ? (
              <Link
                href="/account/security"
                className="rounded-md bg-black px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Verify identity
              </Link>
            ) : null}
            {retry && !rateLimited ? (
              <button
                type="button"
                onClick={retry}
                className="rounded-md border border-black/15 px-3 py-2 text-sm font-semibold dark:border-white/15"
              >
                Try again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
