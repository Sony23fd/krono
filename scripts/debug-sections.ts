import { getStorefrontHomePageSections } from "../src/app/actions/homepage-section-actions"

async function debug() {
  const res = await getStorefrontHomePageSections();
  console.log(JSON.stringify(res, null, 2))
}
debug()
