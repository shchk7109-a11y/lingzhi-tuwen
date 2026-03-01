const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

function scanMaterials(baseDir, webBase) {
  const materials = []
  
  function walk(dir, productLine, productName) {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        // 如果是子目录，更新产品名
        walk(fullPath, productLine, item)
      } else if (/\.(jpg|jpeg|png)$/i.test(item)) {
        const relativePath = fullPath.replace(baseDir, '').replace(/\\/g, '/')
        const webPath = webBase + relativePath
        
        // 判断素材类型
        const filename = item.toLowerCase()
        let sceneType = '场景图'
        let isFormula = false
        let isProduct = false
        
        if (filename.includes('配方') || filename.includes('原料') || filename.includes('成分') || filename.includes('草本')) {
          sceneType = '配方图'
          isFormula = true
        } else if (filename.includes('杯') || filename.includes('饮料包') || filename.includes('产品') || filename.includes('包装') || filename.includes('礼盒')) {
          sceneType = '产品图'
          isProduct = true
        } else if (filename.includes('冲泡')) {
          sceneType = '冲泡图'
        }
        
        // 提取场景标签
        const tags = []
        if (filename.includes('办公') || filename.includes('商务') || filename.includes('会议')) tags.push('职场')
        if (filename.includes('瑜伽') || filename.includes('健身') || filename.includes('运动')) tags.push('运动')
        if (filename.includes('宝妈') || filename.includes('家庭') || filename.includes('早餐')) tags.push('家庭')
        if (filename.includes('咖啡馆') || filename.includes('下午茶') || filename.includes('阅读')) tags.push('休闲')
        if (filename.includes('深夜') || filename.includes('熬夜') || filename.includes('电脑')) tags.push('熬夜')
        if (filename.includes('古风') || filename.includes('茶具') || filename.includes('森林')) tags.push('自然')
        if (filename.includes('女性') || filename.includes('玫瑰') || filename.includes('美容')) tags.push('女性')
        if (filename.includes('户外') || filename.includes('通勤') || filename.includes('街景')) tags.push('户外')
        
        materials.push({
          filename: item,
          filepath: fullPath,
          webPath: webPath,
          productLine: productLine,
          productName: productName,
          sceneType: sceneType,
          isFormula: isFormula,
          isProduct: isProduct,
          tags: tags.join(','),
        })
      }
    }
  }
  
  // 扫描草本咖啡
  const coffeeDir = path.join(baseDir, '草本咖啡')
  if (fs.existsSync(coffeeDir)) {
    const products = fs.readdirSync(coffeeDir)
    for (const product of products) {
      const productDir = path.join(coffeeDir, product)
      if (fs.statSync(productDir).isDirectory()) {
        walk(productDir, '草本咖啡', product)
      }
    }
  }
  
  // 扫描草本茶饮
  const teaDir = path.join(baseDir, '草本茶饮')
  if (fs.existsSync(teaDir)) {
    const products = fs.readdirSync(teaDir)
    for (const product of products) {
      const productDir = path.join(teaDir, product)
      if (fs.statSync(productDir).isDirectory()) {
        // 可能有子目录
        const subItems = fs.readdirSync(productDir)
        let hasSubDir = false
        for (const sub of subItems) {
          const subPath = path.join(productDir, sub)
          if (fs.statSync(subPath).isDirectory()) {
            hasSubDir = true
            walk(subPath, '草本茶饮', product)
          }
        }
        if (!hasSubDir) {
          walk(productDir, '草本茶饮', product)
        }
      }
    }
  }
  
  return materials
}

async function main() {
  const baseDir = '/home/ubuntu/lingzhi-upgraded/public/materials'
  const webBase = '/materials'
  
  console.log('开始扫描素材库...')
  const materials = scanMaterials(baseDir, webBase)
  console.log(`扫描到 ${materials.length} 个素材文件`)
  
  // 清空现有素材
  await prisma.material.deleteMany()
  
  for (const mat of materials) {
    await prisma.material.create({ data: mat })
  }
  
  console.log(`✅ 成功导入 ${materials.length} 个素材到数据库`)
  
  // 统计
  const byLine = {}
  for (const m of materials) {
    byLine[m.productLine] = (byLine[m.productLine] || 0) + 1
  }
  console.log('产品线统计:', byLine)
}

main().catch(console.error).finally(() => prisma.$disconnect())
