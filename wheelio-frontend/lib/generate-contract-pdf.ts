import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  type PDFPage,
  type PDFFont,
  type PDFImage,
} from "pdf-lib"
import QRCode from "qrcode"
import type { ContractCopyKind, ContractPayload } from "@/lib/contract-document"

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 50
const CONTENT_W = PAGE_W - MARGIN * 2
const INK = rgb(0.07, 0.07, 0.07)
const MUTED = rgb(0.38, 0.38, 0.38)
const RULE = rgb(0.72, 0.72, 0.72)
const PAPER = rgb(0.995, 0.995, 0.99)
const LIGHT = rgb(0.94, 0.94, 0.94)

/** pdf-lib StandardFonts only support WinAnsi — strip unsafe glyphs. */
export function sanitizePdfText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u202F\u00A0\u2007\u2009\u200A\u2008]/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[•·∙]/g, "-")
    .replace(/[→←↔⇒]/g, "->")
    .replace(/[✓✔✕✖×]/g, "x")
    .replace(/[∫∑]/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/ {2,}/g, " ")
    .trim()
}

function formatMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} TND`
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const safe = sanitizePdfText(text)
  const words = safe.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      // hard-break overlong tokens
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = ""
        for (const ch of word) {
          const tryChunk = chunk + ch
          if (font.widthOfTextAtSize(tryChunk, size) <= maxWidth) chunk = tryChunk
          else {
            if (chunk) lines.push(chunk)
            chunk = ch
          }
        }
        current = chunk
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) throw new Error("Invalid data URL")
  const base64 = dataUrl.slice(comma + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function fetchUrlToBytes(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith("data:")) return dataUrlToBytes(url)
    const absolute =
      url.startsWith("http") || typeof window === "undefined"
        ? url
        : new URL(url, window.location.origin).href
    const res = await fetch(absolute)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

function drawTextSafe(
  page: PDFPage,
  text: string,
  opts: {
    x: number
    y: number
    size: number
    font: PDFFont
    color?: ReturnType<typeof rgb>
    maxWidth?: number
  },
) {
  const lines = opts.maxWidth
    ? wrapText(text, opts.font, opts.size, opts.maxWidth)
    : [sanitizePdfText(text)]
  let y = opts.y
  for (const line of lines) {
    if (!line) continue
    page.drawText(line, {
      x: opts.x,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color ?? INK,
    })
    y -= opts.size + 3
  }
  return y
}

type DrawCtx = {
  doc: PDFDocument
  font: PDFFont
  fontBold: PDFFont
  fontItalic: PDFFont
  payload: ContractPayload
  copy: ContractCopyKind
  logo?: PDFImage | null
  qr?: PDFImage | null
  signature?: PDFImage | null
  agencyLogo?: PDFImage | null
}

function newPage(ctx: DrawCtx): { page: PDFPage; y: number } {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H])
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_W,
    height: PAGE_H,
    color: PAPER,
  })

  // Watermark
  page.drawText(
    sanitizePdfText(ctx.copy === "customer" ? "CUSTOMER COPY" : "AGENCY COPY"),
    {
      x: 90,
      y: 280,
      size: 42,
      font: ctx.fontBold,
      color: rgb(0.91, 0.91, 0.91),
      rotate: degrees(50),
    },
  )

  // Top rule + running header
  if (ctx.logo) {
    page.drawImage(ctx.logo, {
      x: MARGIN,
      y: PAGE_H - 42,
      width: 22,
      height: 22,
    })
  }
  page.drawText("Wheelio TN", {
    x: MARGIN + (ctx.logo ? 28 : 0),
    y: PAGE_H - 28,
    size: 9,
    font: ctx.fontBold,
    color: INK,
  })
  page.drawText("Car Rental Booking Agreement / Contrat de location", {
    x: MARGIN + (ctx.logo ? 28 : 0),
    y: PAGE_H - 40,
    size: 7,
    font: ctx.font,
    color: MUTED,
  })
  page.drawText(
    sanitizePdfText(ctx.copy === "customer" ? "CUSTOMER COPY" : "AGENCY COPY"),
    {
      x: PAGE_W - MARGIN - 78,
      y: PAGE_H - 32,
      size: 8,
      font: ctx.fontBold,
      color: INK,
    },
  )
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 50 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 50 },
    thickness: 1,
    color: INK,
  })
  page.drawLine({
    start: { x: MARGIN, y: PAGE_H - 53 },
    end: { x: PAGE_W - MARGIN, y: PAGE_H - 53 },
    thickness: 0.4,
    color: RULE,
  })

  return { page, y: PAGE_H - 72 }
}

function ensureSpace(
  ctx: DrawCtx,
  state: { page: PDFPage; y: number },
  needed: number,
) {
  if (state.y - needed < 72) {
    const next = newPage(ctx)
    state.page = next.page
    state.y = next.y
  }
}

function drawFooterAll(ctx: DrawCtx) {
  const pages = ctx.doc.getPages()
  pages.forEach((page, i) => {
    page.drawLine({
      start: { x: MARGIN, y: 48 },
      end: { x: PAGE_W - MARGIN, y: 48 },
      thickness: 0.5,
      color: RULE,
    })
    page.drawText(
      sanitizePdfText(
        `${ctx.payload.contractId}  |  SHA-256 ${ctx.payload.hash}  |  ${i + 1}/${pages.length}  |  SIGNED COPY - DO NOT ALTER`,
      ),
      {
        x: MARGIN,
        y: 34,
        size: 6.5,
        font: ctx.font,
        color: MUTED,
      },
    )
    page.drawText(sanitizePdfText(`Verify: ${ctx.payload.verifyUrl}`), {
      x: MARGIN,
      y: 22,
      size: 6.5,
      font: ctx.font,
      color: MUTED,
    })
  })
}

async function buildOnePdf(
  payload: ContractPayload,
  copy: ContractCopyKind,
  customerSignaturePng: string,
  agencyLogoPng?: string | null,
  wheelioLogoPng?: string | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic)

  const qrDataUrl = await QRCode.toDataURL(payload.verifyUrl, {
    margin: 1,
    width: 160,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  })
  const qr = await doc.embedPng(dataUrlToBytes(qrDataUrl))
  let signature: PDFImage
  try {
    signature = await doc.embedPng(dataUrlToBytes(customerSignaturePng))
  } catch {
    throw new Error("Could not embed signature image (use a fresh signature)")
  }

  let logo: PDFImage | null = null
  if (wheelioLogoPng) {
    try {
      logo = await doc.embedPng(dataUrlToBytes(wheelioLogoPng))
    } catch {
      logo = null
    }
  }

  let agencyLogo: PDFImage | null = null
  if (agencyLogoPng) {
    try {
      agencyLogo = await doc.embedPng(dataUrlToBytes(agencyLogoPng))
    } catch {
      agencyLogo = null
    }
  }

  const ctx: DrawCtx = {
    doc,
    font,
    fontBold,
    fontItalic,
    payload,
    copy,
    logo,
    qr,
    signature,
    agencyLogo,
  }

  const state = newPage(ctx)
  let { page, y } = state

  // Title
  page.drawText("RENTAL BOOKING AGREEMENT", {
    x: MARGIN,
    y,
    size: 16,
    font: fontBold,
    color: INK,
  })
  y -= 14
  page.drawText(
    sanitizePdfText("Accord de reservation de location - Tunisie / Marketplace"),
    {
      x: MARGIN,
      y,
      size: 9,
      font: fontItalic,
      color: MUTED,
    },
  )
  y -= 18

  // Meta strip
  page.drawRectangle({
    x: MARGIN,
    y: y - 58,
    width: CONTENT_W - 72,
    height: 64,
    color: LIGHT,
  })
  page.drawText(sanitizePdfText(`Document ID: ${payload.contractId}`), {
    x: MARGIN + 8,
    y: y - 12,
    size: 9,
    font: fontBold,
    color: INK,
  })
  page.drawText(sanitizePdfText(`Issued: ${payload.issuedAtLabel}`), {
    x: MARGIN + 8,
    y: y - 26,
    size: 8,
    font,
    color: MUTED,
  })
  page.drawText(
    sanitizePdfText(`Integrity (SHA-256): ${payload.hash}`),
    {
      x: MARGIN + 8,
      y: y - 40,
      size: 8,
      font,
      color: MUTED,
    },
  )
  page.drawText(sanitizePdfText("Scan QR to verify booking record"), {
    x: MARGIN + 8,
    y: y - 52,
    size: 7,
    font: fontItalic,
    color: MUTED,
  })
  page.drawImage(qr, {
    x: PAGE_W - MARGIN - 58,
    y: y - 54,
    width: 56,
    height: 56,
  })
  y -= 76

  // Parties box (formal rental agreement style)
  page.drawText("1. PARTIES", {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: INK,
  })
  y -= 14
  const colW = (CONTENT_W - 12) / 2
  page.drawRectangle({
    x: MARGIN,
    y: y - 78,
    width: colW,
    height: 84,
    borderColor: RULE,
    borderWidth: 0.8,
  })
  page.drawRectangle({
    x: MARGIN + colW + 12,
    y: y - 78,
    width: colW,
    height: 84,
    borderColor: RULE,
    borderWidth: 0.8,
  })
  page.drawText("RENTER / CUSTOMER", {
    x: MARGIN + 8,
    y: y - 12,
    size: 7,
    font: fontBold,
    color: MUTED,
  })
  page.drawText(sanitizePdfText(payload.parties.customerName), {
    x: MARGIN + 8,
    y: y - 26,
    size: 9,
    font: fontBold,
    color: INK,
  })
  page.drawText(sanitizePdfText(`Driver: ${payload.parties.driverName}`), {
    x: MARGIN + 8,
    y: y - 40,
    size: 8,
    font,
    color: INK,
  })
  page.drawText(sanitizePdfText(payload.parties.customerEmail), {
    x: MARGIN + 8,
    y: y - 52,
    size: 7,
    font,
    color: MUTED,
  })
  page.drawText(
    sanitizePdfText(
      `${payload.parties.customerPhone} | Licence: ${payload.parties.licenseCountry}`,
    ),
    {
      x: MARGIN + 8,
      y: y - 64,
      size: 7,
      font,
      color: MUTED,
    },
  )

  page.drawText("OWNER / AGENCY (via Wheelio)", {
    x: MARGIN + colW + 20,
    y: y - 12,
    size: 7,
    font: fontBold,
    color: MUTED,
  })
  page.drawText(sanitizePdfText(payload.parties.agencyName), {
    x: MARGIN + colW + 20,
    y: y - 26,
    size: 9,
    font: fontBold,
    color: INK,
  })
  page.drawText(sanitizePdfText(`${payload.parties.agencyCity}, Tunisia`), {
    x: MARGIN + colW + 20,
    y: y - 40,
    size: 8,
    font,
    color: INK,
  })
  page.drawText("Marketplace intermediary: Wheelio TN", {
    x: MARGIN + colW + 20,
    y: y - 54,
    size: 7,
    font: fontItalic,
    color: MUTED,
  })
  page.drawText("Agency supplies vehicle & holds deposit", {
    x: MARGIN + colW + 20,
    y: y - 66,
    size: 7,
    font,
    color: MUTED,
  })
  y -= 100

  // Vehicle / trip
  page.drawText("2. VEHICLE AND RENTAL PERIOD", {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: INK,
  })
  y -= 14
  const vehicleLines = [
    `Vehicle: ${payload.vehicle.modelName}${payload.vehicle.orSimilar ? " or similar" : ""} (${payload.vehicle.categoryLabel})`,
    `Specs: ${payload.vehicle.seats} seats, ${payload.vehicle.bags} bags, ${payload.vehicle.transmission}, ${payload.vehicle.fuel}`,
    `Pickup: ${payload.trip.pickupLocation} - ${payload.trip.pickupLabel}`,
    `Return: ${payload.trip.dropoffLocation} - ${payload.trip.dropoffLabel}`,
    `Duration: ${payload.trip.days} day(s) | Handover: ${payload.trip.pickupMethodNote}`,
  ]
  for (const line of vehicleLines) {
    y = drawTextSafe(page, line, {
      x: MARGIN,
      y,
      size: 9,
      font,
      maxWidth: CONTENT_W,
    })
    y -= 2
  }
  y -= 8

  // Price table
  page.drawText("3. FINANCIAL SCHEDULE (TND)", {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: INK,
  })
  y -= 6
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.6,
    color: RULE,
  })
  y -= 14
  for (const row of payload.priceRows) {
    const label = sanitizePdfText(row.label)
    const amount = formatMoney(row.amountTnd)
    page.drawText(label, { x: MARGIN, y, size: 9, font, color: INK })
    page.drawText(amount, {
      x: PAGE_W - MARGIN - fontBold.widthOfTextAtSize(amount, 9),
      y,
      size: 9,
      font: fontBold,
      color: INK,
    })
    y -= 12
    if (row.note) {
      page.drawText(sanitizePdfText(row.note), {
        x: MARGIN,
        y,
        size: 7,
        font: fontItalic,
        color: MUTED,
      })
      y -= 10
    }
  }
  page.drawText(
    sanitizePdfText(
      `Refundable security deposit at pickup (separate): ${formatMoney(payload.depositTnd)}`,
    ),
    {
      x: MARGIN,
      y,
      size: 8,
      font: fontItalic,
      color: MUTED,
    },
  )
  y -= 12
  page.drawText(sanitizePdfText(`Payment mode: ${payload.paymentLabel}`), {
    x: MARGIN,
    y,
    size: 8,
    font,
    color: INK,
  })
  y -= 18

  // Remaining articles (skip article 1-4 duplicates if present — draw from article 5+)
  // Or draw all articles from payload for legal completeness
  state.page = page
  state.y = y

  for (const article of payload.articles) {
    ensureSpace(ctx, state, 70)
    page = state.page
    y = state.y
    page.drawText(
      sanitizePdfText(
        `Article ${article.number}. ${article.titleEn} / ${article.titleFr}`,
      ),
      {
        x: MARGIN,
        y,
        size: 10,
        font: fontBold,
        color: INK,
      },
    )
    state.y = y - 13
    const lines = wrapText(article.body, font, 9, CONTENT_W)
    for (const line of lines) {
      ensureSpace(ctx, state, 14)
      page = state.page
      y = state.y
      page.drawText(line, { x: MARGIN, y, size: 9, font, color: INK })
      state.y = y - 11
    }
    state.y -= 8
  }

  // Security certificate
  ensureSpace(ctx, state, 110)
  page = state.page
  y = state.y
  page.drawRectangle({
    x: MARGIN,
    y: y - 82,
    width: CONTENT_W,
    height: 88,
    borderColor: INK,
    borderWidth: 1,
  })
  page.drawText("SECURITY CERTIFICATE / ATTESTATION", {
    x: MARGIN + 10,
    y: y - 14,
    size: 9,
    font: fontBold,
    color: INK,
  })
  page.drawText(
    sanitizePdfText(
      "This PDF is a locked booking artifact. Content hash binds trip, price, parties and signature intent.",
    ),
    {
      x: MARGIN + 10,
      y: y - 28,
      size: 7,
      font,
      color: MUTED,
    },
  )
  page.drawText(
    sanitizePdfText(`Contract: ${payload.contractId}  |  Booking: ${payload.bookingId}`),
    {
      x: MARGIN + 10,
      y: y - 42,
      size: 8,
      font: fontBold,
      color: INK,
    },
  )
  const fullHash = payload.hashFull ?? payload.hash
  page.drawText(sanitizePdfText(`SHA-256: ${fullHash.slice(0, 48)}`), {
    x: MARGIN + 10,
    y: y - 56,
    size: 7,
    font,
    color: MUTED,
  })
  if (fullHash.length > 48) {
    page.drawText(sanitizePdfText(fullHash.slice(48)), {
      x: MARGIN + 10,
      y: y - 66,
      size: 7,
      font,
      color: MUTED,
    })
  }
  page.drawText(
    sanitizePdfText(
      "QR verification + dual-copy watermark + marketplace seal. Do not alter.",
    ),
    {
      x: MARGIN + 10,
      y: y - 78,
      size: 7,
      font: fontItalic,
      color: MUTED,
    },
  )
  state.y = y - 100

  // Wheelio seal
  ensureSpace(ctx, state, 50)
  page = state.page
  y = state.y
  page.drawEllipse({
    x: PAGE_W / 2,
    y: y - 16,
    xScale: 48,
    yScale: 16,
    borderWidth: 1.2,
    borderColor: INK,
  })
  page.drawText("WHEELIO TN", {
    x: PAGE_W / 2 - fontBold.widthOfTextAtSize("WHEELIO TN", 8) / 2,
    y: y - 13,
    size: 8,
    font: fontBold,
    color: INK,
  })
  page.drawText("Marketplace attestation", {
    x: PAGE_W / 2 - font.widthOfTextAtSize("Marketplace attestation", 6.5) / 2,
    y: y - 24,
    size: 6.5,
    font,
    color: MUTED,
  })
  state.y = y - 44

  // Signatures
  ensureSpace(ctx, state, 150)
  page = state.page
  y = state.y
  page.drawText("SIGNATURES", {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: INK,
  })
  y -= 16
  const boxW = (CONTENT_W - 14) / 2
  const boxH = 118
  const leftX = MARGIN
  const rightX = MARGIN + boxW + 14
  const boxY = y - boxH

  page.drawRectangle({
    x: leftX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: INK,
    borderWidth: 0.9,
  })
  page.drawRectangle({
    x: rightX,
    y: boxY,
    width: boxW,
    height: boxH,
    borderColor: INK,
    borderWidth: 0.9,
  })

  page.drawText("RENTER / MAIN DRIVER", {
    x: leftX + 8,
    y: boxY + boxH - 14,
    size: 7,
    font: fontBold,
    color: MUTED,
  })
  page.drawText(sanitizePdfText(payload.parties.driverName), {
    x: leftX + 8,
    y: boxY + boxH - 26,
    size: 8,
    font: fontBold,
    color: INK,
  })
  page.drawImage(signature, {
    x: leftX + 10,
    y: boxY + 38,
    width: Math.min(boxW - 20, 170),
    height: 42,
  })
  page.drawLine({
    start: { x: leftX + 8, y: boxY + 34 },
    end: { x: leftX + boxW - 8, y: boxY + 34 },
    thickness: 0.6,
    color: RULE,
  })
  page.drawText(
    sanitizePdfText(
      payload.customerSignedAtLabel
        ? `Electronically signed: ${payload.customerSignedAtLabel}`
        : "Signature pending",
    ),
    {
      x: leftX + 8,
      y: boxY + 18,
      size: 7,
      font: fontItalic,
      color: MUTED,
    },
  )

  page.drawText("PARTNER AGENCY", {
    x: rightX + 8,
    y: boxY + boxH - 14,
    size: 7,
    font: fontBold,
    color: MUTED,
  })
  page.drawText(sanitizePdfText(payload.parties.agencyName), {
    x: rightX + 8,
    y: boxY + boxH - 26,
    size: 8,
    font: fontBold,
    color: INK,
  })

  if (payload.agencyConfirmed) {
    if (agencyLogo) {
      page.drawImage(agencyLogo, {
        x: rightX + 12,
        y: boxY + 42,
        width: 44,
        height: 44,
      })
      page.drawText("AGENCY STAMP", {
        x: rightX + 64,
        y: boxY + 62,
        size: 9,
        font: fontBold,
        color: INK,
      })
      page.drawText(
        sanitizePdfText(payload.agencySignedAtLabel || "Confirmed"),
        {
          x: rightX + 64,
          y: boxY + 48,
          size: 7,
          font: fontItalic,
          color: MUTED,
        },
      )
    } else {
      page.drawText("ACCEPTED", {
        x: rightX + 18,
        y: boxY + 58,
        size: 14,
        font: fontBold,
        color: INK,
      })
      page.drawText(
        sanitizePdfText(payload.agencySignedAtLabel || "Confirmed by agency"),
        {
          x: rightX + 18,
          y: boxY + 42,
          size: 7,
          font: fontItalic,
          color: MUTED,
        },
      )
    }
  } else {
    page.drawText("Pending agency acceptance", {
      x: rightX + 14,
      y: boxY + 60,
      size: 9,
      font: fontItalic,
      color: MUTED,
    })
    page.drawText("Stamp applied when booking is confirmed", {
      x: rightX + 14,
      y: boxY + 46,
      size: 7,
      font,
      color: MUTED,
    })
  }

  page.drawLine({
    start: { x: rightX + 8, y: boxY + 34 },
    end: { x: rightX + boxW - 8, y: boxY + 34 },
    thickness: 0.6,
    color: RULE,
  })
  page.drawText(sanitizePdfText(`${payload.parties.agencyCity}, Tunisia`), {
    x: rightX + 8,
    y: boxY + 18,
    size: 7,
    font,
    color: MUTED,
  })

  drawFooterAll(ctx)
  return doc.save()
}

export type GenerateContractPdfsInput = {
  payload: ContractPayload
  customerSignaturePng: string
  agencyLogoPng?: string | null
  wheelioLogoPng?: string | null
}

export type GeneratedContractPdfs = {
  customerPdf: Uint8Array
  agencyPdf: Uint8Array
}

export async function generateContractPdfs(
  input: GenerateContractPdfsInput,
): Promise<GeneratedContractPdfs> {
  if (!input.customerSignaturePng?.startsWith("data:image")) {
    throw new Error("Missing customer signature image")
  }

  let wheelioLogoPng = input.wheelioLogoPng ?? null
  if (!wheelioLogoPng && typeof window !== "undefined") {
    wheelioLogoPng = await logoUrlToPngDataUrl("/logos/wheelio-icon.png", 128)
  }

  const [customerPdf, agencyPdf] = await Promise.all([
    buildOnePdf(
      input.payload,
      "customer",
      input.customerSignaturePng,
      input.agencyLogoPng,
      wheelioLogoPng,
    ),
    buildOnePdf(
      input.payload,
      "agency",
      input.customerSignaturePng,
      input.agencyLogoPng,
      wheelioLogoPng,
    ),
  ])
  return { customerPdf, agencyPdf }
}

export function pdfBytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function base64ToPdfBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function toBlobPart(bytes: Uint8Array): BlobPart {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([toBlobPart(bytes)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function openPrintPdf(bytes: Uint8Array) {
  const blob = new Blob([toBlobPart(bytes)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}

export async function logoUrlToPngDataUrl(
  url: string,
  size = 128,
): Promise<string | null> {
  try {
    if (url.startsWith("data:image/png")) return url
    const bytes = await fetchUrlToBytes(url)
    if (!bytes) return null

    // Prefer direct PNG embed path for known PNG assets
    if (
      url.endsWith(".png") ||
      url.includes("image/png") ||
      (bytes[0] === 0x89 && bytes[1] === 0x50)
    ) {
      let binary = ""
      for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]!)
      }
      return `data:image/png;base64,${btoa(binary)}`
    }

    const blob = new Blob([toBlobPart(bytes)])
    const objectUrl = URL.createObjectURL(blob)
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = objectUrl
    })
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx2d = canvas.getContext("2d")
    if (!ctx2d) return null
    ctx2d.fillStyle = "#ffffff"
    ctx2d.fillRect(0, 0, size, size)
    ctx2d.drawImage(img, 0, 0, size, size)
    URL.revokeObjectURL(objectUrl)
    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}
