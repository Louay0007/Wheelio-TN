import { describe, expect, it } from "vitest"
import {
  faqItemSchema,
  guideArticleSchema,
  helpArticleSchema,
  legalDocumentSchema,
  parseStructuredContent,
} from "@/lib/contracts/content"
import { FAQ_ITEMS } from "@/lib/faq"
import { GUIDES } from "@/lib/guides"
import { HELP_ARTICLES } from "@/lib/help-articles"
import { LEGAL_DOCS } from "@/lib/legal"

describe("public CMS structured contracts", () => {
  it("accepts all seeded source catalogs", () => {
    expect(faqItemSchema.array().parse(FAQ_ITEMS)).toHaveLength(FAQ_ITEMS.length)
    expect(helpArticleSchema.array().parse(HELP_ARTICLES)).toHaveLength(
      HELP_ARTICLES.length,
    )
    expect(guideArticleSchema.array().parse(GUIDES)).toHaveLength(GUIDES.length)
    expect(legalDocumentSchema.array().parse(LEGAL_DOCS)).toHaveLength(
      LEGAL_DOCS.length,
    )
  })

  it("parses structured content from a CMS envelope", () => {
    const faq = FAQ_ITEMS[0]!
    expect(
      parseStructuredContent(
        {
          kind: "faq",
          slug: faq.id,
          locale: "en",
          title: faq.question,
          body: faq.answer,
          structuredContent: JSON.stringify(faq),
          revision: 1,
          publishedAt: "2026-07-23T12:00:00.000Z",
        },
        faqItemSchema,
      ),
    ).toEqual(faq)
  })
})
