"use client"

import { useEffect, useState } from "react"
import {
  contractStorageKey,
  type StoredContractArtifacts,
} from "@/lib/contract-document"
import {
  base64ToPdfBytes,
  downloadPdf,
  generateContractPdfs,
  logoUrlToPngDataUrl,
  openPrintPdf,
  pdfBytesToBase64,
} from "@/lib/generate-contract-pdf"

export function saveContractArtifacts(artifacts: StoredContractArtifacts) {
  try {
    sessionStorage.setItem(
      contractStorageKey(artifacts.payload.bookingId),
      JSON.stringify(artifacts),
    )
  } catch {
    // private mode / quota
  }
}

export function loadContractArtifacts(
  bookingId: string,
): StoredContractArtifacts | null {
  try {
    const raw = sessionStorage.getItem(contractStorageKey(bookingId))
    if (!raw) return null
    return JSON.parse(raw) as StoredContractArtifacts
  } catch {
    return null
  }
}

type ContractDownloadsProps = {
  bookingId: string
  contractId?: string
  /** When true, refresh agency PDF with stamp if missing */
  agencyConfirmed?: boolean
  className?: string
}

export function ContractDownloads({
  bookingId,
  contractId,
  agencyConfirmed = false,
  className,
}: ContractDownloadsProps) {
  const [artifacts, setArtifacts] = useState<StoredContractArtifacts | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      let stored = loadContractArtifacts(bookingId)
      if (
        stored &&
        agencyConfirmed &&
        !stored.payload.agencyConfirmed &&
        stored.customerSignaturePng
      ) {
        try {
          const payload = {
            ...stored.payload,
            agencyConfirmed: true,
            agencySignedAtLabel: new Date().toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }
          const agencyLogoPng = stored.agencyLogoUrl
            ? await logoUrlToPngDataUrl(stored.agencyLogoUrl)
            : null
          const pdfs = await generateContractPdfs({
            payload,
            customerSignaturePng: stored.customerSignaturePng,
            agencyLogoPng,
          })
          stored = {
            ...stored,
            payload,
            customerPdfBase64: pdfBytesToBase64(pdfs.customerPdf),
            agencyPdfBase64: pdfBytesToBase64(pdfs.agencyPdf),
          }
          saveContractArtifacts(stored)
        } catch {
          // keep original
        }
      }
      if (!cancelled) setArtifacts(stored)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [bookingId, agencyConfirmed])

  const id = contractId || artifacts?.payload.contractId || bookingId

  if (!artifacts) {
    return (
      <p
        className={
          className
            ? `${className} text-sm text-black/50 dark:text-white/50`
            : "text-sm text-black/50 dark:text-white/50"
        }
      >
        Signed PDFs are available in this browser session after checkout.
        Complete signing on the same device to download Customer and Agency
        copies.
      </p>
    )
  }

  const customerBytes = base64ToPdfBytes(artifacts.customerPdfBase64)
  const agencyBytes = base64ToPdfBytes(artifacts.agencyPdfBase64)

  return (
    <div className={className}>
      <p className="text-sm font-semibold">Signed agreement PDFs</p>
      <p className="mt-1 text-xs text-black/50 dark:text-white/50">
        {id} · integrity {artifacts.payload.hash} · Customer + Agency copies
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            downloadPdf(customerBytes, `${id}-CUSTOMER.pdf`)
            setBusy(false)
          }}
          className="inline-flex h-10 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black"
        >
          Download Customer PDF
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            downloadPdf(agencyBytes, `${id}-AGENCY.pdf`)
            setBusy(false)
          }}
          className="inline-flex h-10 items-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
        >
          Download Agency PDF
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => openPrintPdf(customerBytes)}
          className="inline-flex h-10 items-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold dark:border-white/20"
        >
          Print Customer copy
        </button>
      </div>
    </div>
  )
}
