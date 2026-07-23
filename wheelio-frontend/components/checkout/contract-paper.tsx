"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import QRCode from "qrcode"
import type { ContractPayload } from "@/lib/contract-document"
import { formatTnd } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type ContractPaperProps = {
  payload: ContractPayload
  signatureDataUrl?: string | null
  agencyLogoUrl?: string | null
  className?: string
  highlightCustomerPad?: boolean
}

export function ContractPaper({
  payload,
  signatureDataUrl,
  agencyLogoUrl,
  className,
  highlightCustomerPad = false,
}: ContractPaperProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(payload.verifyUrl, {
      margin: 1,
      width: 160,
      errorCorrectionLevel: "H",
      color: { dark: "#111111", light: "#fcfcfa" },
    }).then((url) => {
      if (!cancelled) setQrUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [payload.verifyUrl])

  return (
    <article
      className={cn(
        "contract-paper relative overflow-hidden rounded-[2px] border border-black/30 bg-[#fcfcfa] text-[#111] shadow-[0_24px_64px_rgba(0,0,0,0.12)]",
        className,
      )}
      style={{
        fontFamily: "var(--font-contract-serif), 'Times New Roman', Times, serif",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 27px, #000 28px)",
        }}
      />

      <header className="relative px-5 pb-5 pt-6 sm:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative size-11 overflow-hidden border border-black/25 bg-white">
              <Image
                src="/logos/wheelio-icon.png"
                alt="Wheelio"
                fill
                sizes="44px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55">
                Wheelio TN
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-black/45">
                Marketplace · Tunisie
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em]">
              Formal instrument
            </p>
            <p className="mt-1 font-mono text-[10px] text-black/50">
              {payload.contractId}
            </p>
          </div>
        </div>

        <div className="mt-5 border-y-[1.5px] border-black py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-black/50">
            Contrat de location / Rental agreement
          </p>
          <h2 className="mt-2 text-[1.75rem] font-normal leading-tight tracking-[-0.02em] sm:text-[2rem]">
            Rental Booking Agreement
          </h2>
          <p className="mt-2 text-sm italic text-black/55">
            Binding booking request under Wheelio marketplace terms
          </p>
        </div>

        <div className="mt-4 grid gap-3 border border-black/20 bg-black/[0.025] p-3 sm:grid-cols-[1fr_auto]">
          <div className="space-y-1.5 text-xs leading-relaxed text-black/65">
            <p>
              <span className="font-semibold text-black">Document ID:</span>{" "}
              <span className="font-mono">{payload.contractId}</span>
            </p>
            <p>
              <span className="font-semibold text-black">Booking:</span>{" "}
              <span className="font-mono">{payload.bookingId}</span>
            </p>
            <p>
              <span className="font-semibold text-black">Issued:</span>{" "}
              {payload.issuedAtLabel}
            </p>
            <p className="break-all font-mono text-[10px]">
              <span className="font-sans font-semibold text-black">
                SHA-256:
              </span>{" "}
              {payload.hashFull ?? payload.hash}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
              Signed copy — do not alter
            </p>
          </div>
          {qrUrl ? (
            <div className="justify-self-end border border-black/25 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Verification QR code" className="size-[84px]" />
              <p className="mt-1.5 text-center text-[8px] uppercase tracking-[0.14em] text-black/45">
                Verify record
              </p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="relative max-h-[min(62vh,600px)] space-y-7 overflow-y-auto px-5 py-5 sm:px-10">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="border border-black/30 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              §1 · Renter / Customer
            </p>
            <p className="mt-2 text-[15px] font-semibold leading-snug">
              {payload.parties.customerName}
            </p>
            <p className="mt-1.5 text-xs text-black/60">
              Driver: {payload.parties.driverName}
            </p>
            <p className="text-xs text-black/55">{payload.parties.customerEmail}</p>
            <p className="text-xs text-black/55">
              {payload.parties.customerPhone} · Licence{" "}
              {payload.parties.licenseCountry}
            </p>
          </div>
          <div className="border border-black/30 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
              §1 · Owner / Agency
            </p>
            <p className="mt-2 text-[15px] font-semibold leading-snug">
              {payload.parties.agencyName}
            </p>
            <p className="mt-1.5 text-xs text-black/60">
              {payload.parties.agencyCity}, Tunisia
            </p>
            <p className="text-xs italic text-black/50">
              Intermediary: Wheelio TN (marketplace)
            </p>
          </div>
        </section>

        <section>
          <h3 className="border-b border-black pb-1 text-[13px] font-semibold tracking-[0.06em]">
            §3 · Financial schedule (TND)
          </h3>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {payload.priceRows.map((row) => (
                <tr key={row.label} className="border-b border-black/10">
                  <td className="py-2.5 pr-3 align-top leading-snug">
                    {row.label}
                    {row.note ? (
                      <span className="mt-0.5 block text-xs italic text-black/45">
                        {row.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatTnd(row.amountTnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs italic leading-relaxed text-black/50">
            Refundable deposit at pickup: {formatTnd(payload.depositTnd)}{" "}
            (held separately). Payment: {payload.paymentLabel}.
          </p>
        </section>

        {payload.articles.map((article) => (
          <section key={article.number} className="scroll-mt-4">
            <h3 className="text-[13px] font-semibold leading-snug tracking-[0.01em]">
              <span className="mr-1.5 font-normal text-black/40">§</span>
              Article {article.number}. {article.titleEn}{" "}
              <span className="font-normal italic text-black/45">
                / {article.titleFr}
              </span>
            </h3>
            <p className="mt-2 text-[13.5px] leading-[1.75] text-black/80">
              {article.body}
            </p>
          </section>
        ))}

        <section className="border-2 border-black p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                Security certificate
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-black/65">
                After signature, Customer and Agency PDFs embed the handwritten
                mark, Wheelio attestation seal, dual-copy watermark, document ID,
                verification QR, and SHA-256 integrity digest.
              </p>
            </div>
            {qrUrl ? (
              <div className="border border-black/20 bg-white p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="" className="size-14" />
              </div>
            ) : null}
          </div>
          <p className="mt-3 break-all font-mono text-[10px] leading-relaxed text-black/55">
            {payload.hashFull ?? payload.hash}
          </p>
          <ul className="mt-3 space-y-1 text-[11px] text-black/55">
            <li>Ref A — {payload.contractId} (primary instrument)</li>
            <li>Ref B — booking {payload.bookingId}</li>
            <li>Ref C — verify {payload.verifyUrl}</li>
          </ul>
        </section>

        <div className="flex flex-col items-center py-2">
          <div className="flex h-12 w-44 items-center justify-center rounded-full border-[1.5px] border-black px-3 text-center">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em]">WHEELIO TN</p>
              <p className="text-[8px] text-black/55">Marketplace attestation</p>
            </div>
          </div>
        </div>

        <section>
          <h3 className="mb-3 border-b border-black pb-1 text-[13px] font-semibold tracking-[0.06em]">
            Signatures
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className={cn(
                "min-h-[148px] border border-black bg-white p-3 transition",
                highlightCustomerPad && "ring-2 ring-black/50",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Renter / Main driver
              </p>
              <p className="mt-1 text-xs">{payload.parties.driverName}</p>
              <div className="mt-3 flex h-14 items-end border-b border-dashed border-black/40">
                {signatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signatureDataUrl}
                    alt="Customer signature"
                    className="max-h-14 w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="pb-1 text-xs italic text-black/35">
                    Sign below · mouse or finger
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] italic text-black/45">
                {payload.customerSignedAtLabel
                  ? `Signed electronically · ${payload.customerSignedAtLabel}`
                  : "Awaiting signature"}
              </p>
            </div>

            <div className="min-h-[148px] border border-black bg-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Partner agency
              </p>
              <p className="mt-1 text-xs">
                {payload.parties.agencyName} · {payload.parties.agencyCity}
              </p>
              <div className="mt-3 flex h-14 items-center gap-2 border-b border-dashed border-black/40">
                {payload.agencyConfirmed ? (
                  <>
                    {agencyLogoUrl ? (
                      <div className="relative size-10 overflow-hidden border border-black/15">
                        <Image
                          src={agencyLogoUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <span className="text-sm font-semibold tracking-wide">
                      ACCEPTED
                    </span>
                  </>
                ) : (
                  <span className="text-xs italic text-black/40">
                    Pending agency acceptance
                  </span>
                )}
              </div>
              <p className="mt-2 text-[10px] italic text-black/45">
                {payload.agencyConfirmed
                  ? payload.agencySignedAtLabel || "Confirmed by agency"
                  : "Stamp applied when booking is confirmed"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative border-t border-black/30 px-5 py-3 font-mono text-[9px] leading-relaxed text-black/45 sm:px-10">
        {payload.contractId} · SHA-256 {payload.hash} · verify {payload.verifyUrl}
      </footer>
    </article>
  )
}
