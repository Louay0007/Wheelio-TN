"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Building2, ChevronRight } from "lucide-react"
import { PartnerContractPaper } from "@/components/partners/partner-contract-paper"
import { PageHero, PageShell } from "@/components/page-shell"
import { fieldInputClass } from "@/components/account/password-fields"
import { PasswordFields } from "@/components/account/password-fields"
import { Checkbox } from "@/components/ui/checkbox"
import { PARTNER_PRICING, recommendedCommissionExample } from "@/lib/partner-pricing"
import { cn } from "@/lib/utils"

const PICKUP_OPTIONS = [
  { id: "counter", label: "Airport / desk counter" },
  { id: "meet_greet", label: "Meet & greet" },
  { id: "delivery", label: "Hotel / address delivery" },
] as const

const CITIES = [
  "Tunis",
  "La Marsa",
  "Hammamet",
  "Sousse",
  "Monastir",
  "Sfax",
  "Djerba",
  "Other",
] as const

type Step = 1 | 2 | 3

export function PartnerJoinForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [legalName, setLegalName] = useState("")
  const [tradeName, setTradeName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("+216 ")
  const [city, setCity] = useState("Tunis")
  const [address, setAddress] = useState("")
  const [fleetSize, setFleetSize] = useState("6-15")
  const [pickupMethods, setPickupMethods] = useState<string[]>(["counter"])
  const [website, setWebsite] = useState("")
  const [iban, setIban] = useState("")
  const [password, setPassword] = useState("")
  const [contractAgreed, setContractAgreed] = useState(false)
  const [accuracyAgreed, setAccuracyAgreed] = useState(false)

  const displayAgency = useMemo(
    () => tradeName.trim() || legalName.trim() || "Partner Agency",
    [tradeName, legalName],
  )
  const commissionExample = recommendedCommissionExample()

  function togglePickup(id: string) {
    setPickupMethods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function validateStep1() {
    if (!legalName.trim() || !tradeName.trim() || !taxId.trim()) {
      setError("Enter legal name, trade name, and tax ID.")
      return false
    }
    if (!contactName.trim() || !email.trim() || phone.trim().length < 8) {
      setError("Enter contact name, email, and phone.")
      return false
    }
    if (!address.trim()) {
      setError("Enter the main desk / HQ address.")
      return false
    }
    if (pickupMethods.length === 0) {
      setError("Select at least one pickup method.")
      return false
    }
    setError(null)
    return true
  }

  function validateStep2() {
    if (!password || password.length < 8) {
      setError("Choose a password with at least 8 characters.")
      return false
    }
    setError(null)
    return true
  }

  async function handleSubmit() {
    setError(null)
    if (!contractAgreed) {
      setError("Tick the box to agree to the Partner Marketplace Agreement.")
      return
    }
    if (!accuracyAgreed) {
      setError("Confirm that the agency details are accurate.")
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "wheelio-partner-application",
        JSON.stringify({
          legalName,
          tradeName,
          taxId,
          contactName,
          email,
          phone,
          city,
          address,
          fleetSize,
          pickupMethods,
          website,
          iban: iban ? `••••${iban.slice(-4)}` : "",
          contractAgreed: true,
          submittedAt: new Date().toISOString(),
        }),
      )
    }
    setLoading(false)
    router.push("/partners/join/success")
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Partners"
        title="List your agency on Wheelio"
        description={`Join the Tunisia marketplace. Recommended commission: ${PARTNER_PRICING.recommendedPercent}% of the customer trip total (deposit separate). Example: your net ${commissionExample.agencyNetTnd} TND → listed ${commissionExample.listedPriceTnd} TND.`}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Progress */}
        <ol className="mb-8 flex flex-wrap gap-2" aria-label="Application steps">
          {(
            [
              [1, "Agency details"],
              [2, "Account access"],
              [3, "Contract & agree"],
            ] as const
          ).map(([n, label]) => (
            <li key={n}>
              <button
                type="button"
                onClick={() => {
                  if (n < step) setStep(n)
                }}
                className={cn("inline-flex min-h-11 items-center gap-2 rounded-[8px] border px-3 text-sm font-medium transition-colors duration-200",
                  step === n
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : step > n
                      ? "border-black/20 text-black dark:border-white/20 dark:text-white"
                      : "border-black/10 text-black/40 dark:border-white/10 dark:text-white/40",
                )}
              >
                <span className="font-mono text-xs">{n}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
          {/* Form column */}
          <div>
            {error ? (
              <p
                role="alert"
                className="mb-4 rounded-[8px] border border-black/20 bg-black/[0.03] px-4 py-3 text-sm dark:border-white/20"
              >
                {error}
              </p>
            ) : null}

            {step === 1 ? (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validateStep1()) setStep(2)
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em]">
                  <Building2 className="size-4" />
                  Agency identity
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">Legal company name</span>
                    <input
                      required
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className={fieldInputClass}
                      placeholder="SARL …"
                      autoComplete="organization"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Trade / brand name</span>
                    <input
                      required
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className={fieldInputClass}
                      placeholder="Shown to travellers"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Tax ID / matricule fiscale</span>
                    <input
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      className={fieldInputClass}
                      placeholder="TN …"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Primary contact</span>
                    <input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={fieldInputClass}
                      autoComplete="name"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Work email</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldInputClass}
                      autoComplete="email"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Phone</span>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldInputClass}
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Main city</span>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={fieldInputClass}
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Approx. fleet size</span>
                    <select
                      value={fleetSize}
                      onChange={(e) => setFleetSize(e.target.value)}
                      className={fieldInputClass}
                    >
                      <option value="1-5">1–5 cars</option>
                      <option value="6-15">6–15 cars</option>
                      <option value="16-40">16–40 cars</option>
                      <option value="40+">40+ cars</option>
                    </select>
                  </label>
                  <label className="block space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">HQ / main desk address</span>
                    <input
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={fieldInputClass}
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">Website (optional)</span>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={fieldInputClass}
                      placeholder="https://"
                    />
                  </label>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Pickup methods</legend>
                  <ul className="grid gap-2 sm:grid-cols-1">
                    {PICKUP_OPTIONS.map(({ id, label }) => (
                      <li key={id}>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-black/10 px-3 dark:border-white/10">
                          <Checkbox
                            checked={pickupMethods.includes(id)}
                            onCheckedChange={() => togglePickup(id)}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>

                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-black text-sm font-semibold text-white dark:bg-white dark:text-black sm:w-auto sm:px-8"
                >
                  Continue
                  <ChevronRight className="size-4" />
                </button>
              </form>
            ) : null}

            {step === 2 ? (
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (validateStep2()) setStep(3)
                }}
              >
                <p className="text-sm font-semibold tracking-[-0.02em]">
                  Partner portal access (demo)
                </p>
                <p className="text-sm text-black/55 dark:text-white/55">
                  You will use this email to manage listings after approval.
                </p>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Login email</span>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={cn(fieldInputClass, "bg-black/[0.03] dark:bg-white/[0.04]")}
                  />
                </label>
                <PasswordFields
                  showStrength
                  passwordValue={password}
                  onPasswordChange={setPassword}
                  autoComplete="new-password"
                />
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">IBAN for payouts (optional)</span>
                  <input
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    className={fieldInputClass}
                    placeholder="TN59 …"
                    autoComplete="off"
                  />
                  <span className="text-xs text-black/45">
                    Never share full PAN card numbers here — bank IBAN only.
                  </span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Review contract
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </form>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <p className="text-sm font-semibold tracking-[-0.02em]">
                  Agree to partner terms
                </p>
                <p className="text-sm leading-relaxed text-black/55 dark:text-white/55">
                  Read the agreement on the right (or below on mobile). Standard
                  commission is {PARTNER_PRICING.recommendedPercent}%: a Partner
                  net of {commissionExample.agencyNetTnd} TND lists
                  at {commissionExample.listedPriceTnd} TND to the
                  traveller.
                </p>

                <div className="lg:hidden">
                  <PartnerContractPaper
                    agencyName={displayAgency}
                    compact
                    className="rounded-[4px]"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-black/15 p-4 dark:border-white/15">
                  <Checkbox
                    checked={contractAgreed}
                    onCheckedChange={(v) => setContractAgreed(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-relaxed">
                    <span className="font-semibold">I agree</span> to the Wheelio
                    TN Partner Marketplace Agreement, including the standard{" "}
                    {PARTNER_PRICING.recommendedPercent}% commission on the
                    customer trip total (Partner net + Wheelio fee = listed
                    price). Launch/volume rates may apply as published. Deposits
                    at pickup stay with the agency and are never part of the
                    commission.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-black/10 p-4 dark:border-white/10">
                  <Checkbox
                    checked={accuracyAgreed}
                    onCheckedChange={(v) => setAccuracyAgreed(v === true)}
                    className="mt-0.5"
                  />
                  <span className="text-sm leading-relaxed">
                    I confirm the agency details are accurate and that we hold
                    valid rental authorisations in Tunisia.
                  </span>
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-5 text-sm font-semibold dark:border-white/15"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleSubmit()}
                    className="inline-flex h-11 items-center rounded-[8px] bg-black px-6 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-black"
                  >
                    {loading ? "Submitting…" : "Submit partner application"}
                  </button>
                </div>

                <p className="text-xs text-black/45 dark:text-white/45">
                  Prefer to rent a car instead?{" "}
                  <Link href="/signup" className="font-medium underline underline-offset-4">
                    Create a traveller account
                  </Link>
                  .
                </p>
              </div>
            ) : null}
          </div>

          {/* Contract column — desktop sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
                Partnership contract
              </p>
              <PartnerContractPaper
                agencyName={displayAgency}
                compact
                className="rounded-[4px]"
              />
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  )
}
