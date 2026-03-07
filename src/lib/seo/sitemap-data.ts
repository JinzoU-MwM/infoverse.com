import { listSitemapPublicEntities } from "@/lib/content/queries";

export async function getSitemapEntitySlugs() {
  return listSitemapPublicEntities();
}
