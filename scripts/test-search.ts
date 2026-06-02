import { getActiveProducts } from './src/app/actions/product-actions'

async function main() {
  const result = await getActiveProducts({ search: 'Звёдная парочка' })
  console.log(JSON.stringify(result, null, 2))
}

main().catch(console.error)
