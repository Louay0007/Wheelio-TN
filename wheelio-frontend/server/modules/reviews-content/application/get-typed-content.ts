import type { AppLocaleDto } from "@/lib/contracts/common"
import {
  cmsContentSchema,
  type CmsContent,
} from "@/lib/contracts/public-catalog"
import {
  getPublishedContent,
  listPublishedContent,
} from "@/server/modules/reviews-content/application/get-published-content"

export async function listTypedContent(
  kind: string,
  locale: AppLocaleDto,
): Promise<CmsContent[]> {
  return cmsContentSchema
    .array()
    .parse(await listPublishedContent({ kind, locale }))
}

export async function getTypedContent(
  kind: string,
  slug: string,
  locale: AppLocaleDto,
): Promise<CmsContent> {
  return cmsContentSchema.parse(
    await getPublishedContent({ kind, slug, locale }),
  )
}
