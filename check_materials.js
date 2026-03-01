const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const count = await p.material.count()
  console.log('素材总数:', count)
  
  const samples = await p.material.findMany({ take: 3 })
  samples.forEach(m => {
    console.log('---')
    console.log('filename:', m.filename)
    console.log('webPath:', m.webPath)
    console.log('filepath:', m.filepath)
    console.log('productLine:', m.productLine)
    console.log('productName:', m.productName)
    console.log('tags:', m.tags)
  })
}

main().catch(console.error).finally(() => p.$disconnect())
