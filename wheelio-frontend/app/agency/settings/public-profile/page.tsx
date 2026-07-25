"use client"

import Link from "next/link"
import { useState } from "react"
import { AgencyShell } from "@/components/agency/agency-shell"
import { useAgencySession } from "@/lib/agency-session"

export default function PublicProfileSettingsPage() {
  const { workspace, updateWorkspace } = useAgencySession()
  const [bio, setBio] = useState(workspace?.publicBio ?? "")
  return (
    <AgencyShell title="Public profile" description="Drives what customers see on /agencies/[slug].">
      <textarea
        className="min-h-32 w-full max-w-2xl rounded-[10px] border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <div className="mt-4 max-w-md rounded-[12px] border border-zinc-200 dark:border-zinc-700 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Live preview</p>
        <p className="mt-2 text-lg font-semibold">{workspace?.tradeName}</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{bio}</p>
      </div>
      <button
        type="button"
        className="mt-4 h-11 cursor-pointer rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-950"
        onClick={() => updateWorkspace((ws) => (ws ? { ...ws, publicBio: bio } : ws))}
      >
        Save
      </button>
      {workspace?.slug ? (
        <Link href={`/agencies/${workspace.slug}`} className="ml-3 text-sm underline">
          View public page
        </Link>
      ) : null}
    </AgencyShell>
  )
}
