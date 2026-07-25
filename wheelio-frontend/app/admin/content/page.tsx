"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import { AdminLinkButton, AdminPanel } from "@/components/admin/admin-kit"

const LINKS = [
  { href: "/admin/content/guides", label: "Guides", hint: "Long-form SEO articles" },
  { href: "/admin/content/help", label: "Help center", hint: "Support articles" },
  { href: "/admin/content/faq", label: "FAQ", hint: "Short answers" },
  { href: "/admin/content/reviews", label: "Reviews", hint: "Moderation queue" },
  { href: "/admin/content/legal", label: "Legal", hint: "Terms version notes" },
  { href: "/admin/promotions", label: "Promotions", hint: "Codes and featured" },
]

export default function AdminContentHubPage() {
  return (
    <AdminShell
      title="Content"
      description="Growth and trust surfaces on the customer site."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <AdminPanel key={item.href} title={item.label} hint={item.hint}>
            <AdminLinkButton href={item.href} variant="secondary">
              Open
            </AdminLinkButton>
          </AdminPanel>
        ))}
      </div>
    </AdminShell>
  )
}
