import { PrismaClient, ProductStatus } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function seed() {
  let crm = await prisma.product.findFirst({
    where: { name: 'CRM System' }
  })
  
  if (!crm) {
    crm = await prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'CRM System',
        description: 'Харилцагчдын мэдээлэл, борлуулалтын урсгалыг нэг дороос удирдах ухаалаг шийдэл.',
        price: 499000,
        stockQuantity: 999,
        sku: 'SAAS-CRM',
        slug: 'crm-system',
        status: ProductStatus.ACTIVE
      }
    })
    console.log('Created CRM System:', crm.id)
  } else {
    console.log('CRM System already exists:', crm.id)
  }

  let erp = await prisma.product.findFirst({
    where: { name: 'ERP System' }
  })

  if (!erp) {
    erp = await prisma.product.create({
      data: {
        id: uuidv4(),
        name: 'ERP System',
        description: 'Байгууллагынхаа санхүү, хүний нөөц, агуулахын үйл ажиллагааг нэгдсэн системд төвлөрүүлэн хянах.',
        price: 999000,
        stockQuantity: 999,
        sku: 'SAAS-ERP',
        slug: 'erp-system',
        status: ProductStatus.ACTIVE
      }
    })
    console.log('Created ERP System:', erp.id)
  } else {
    console.log('ERP System already exists:', erp.id)
  }
}

seed()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
