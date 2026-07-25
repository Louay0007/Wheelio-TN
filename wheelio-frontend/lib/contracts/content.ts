import { z } from "zod"
import type { CmsContent } from "@/lib/contracts/public-catalog"

export const faqItemSchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
})
export type FaqContentItem = z.infer<typeof faqItemSchema>

export const helpArticleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().min(1),
  summary: z.string().min(1),
  updatedAt: z.iso.date(),
  steps: z.array(z.string().min(1)),
  body: z.array(z.string().min(1)),
  relatedSlugs: z.array(z.string().min(1)),
})
export type HelpContentArticle = z.infer<typeof helpArticleSchema>

export const guideSectionSchema = z.object({
  heading: z.string().min(1),
  paragraphs: z.array(z.string().min(1)),
  bullets: z.array(z.string().min(1)).optional(),
})

export const guideArticleSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  readMinutes: z.number().int().positive(),
  updated: z.iso.date(),
  intro: z.string().min(1),
  sections: z.array(guideSectionSchema),
  midCta: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
  }),
})
export type GuideContentArticle = z.infer<typeof guideArticleSchema>

export const legalSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)),
})

export const legalDocumentSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  lastUpdated: z.iso.date(),
  intro: z.string().min(1),
  sections: z.array(legalSectionSchema),
})
export type LegalContentDocument = z.infer<typeof legalDocumentSchema>

export function parseStructuredContent<T>(
  content: CmsContent,
  schema: z.ZodType<T>,
): T {
  if (!content.structuredContent) {
    throw new Error(
      `CMS ${content.kind}/${content.slug} has no structured content`,
    )
  }

  let value: unknown
  try {
    value = JSON.parse(content.structuredContent)
  } catch (cause) {
    throw new Error(
      `CMS ${content.kind}/${content.slug} contains invalid JSON`,
      { cause },
    )
  }
  return schema.parse(value)
}
