import SearchClient from "./SearchClient"

export const dynamic = "force-dynamic"

export default async function OrdersSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <SearchClient initialQuery={q} />
  )
}
