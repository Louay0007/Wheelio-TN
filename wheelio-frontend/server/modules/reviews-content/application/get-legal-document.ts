import type { AppLocaleDto } from "@/lib/contracts/common"
import {
  legalDocumentSchema,
  parseStructuredContent,
} from "@/lib/contracts/content"
import { getTypedContent } from "@/server/modules/reviews-content/application/get-typed-content"

export async function getLegalDocument(
  slug: string,
  locale: AppLocaleDto,
) {
  const content = await getTypedContent("legal", slug, locale)
  return parseStructuredContent(content, legalDocumentSchema)
}
