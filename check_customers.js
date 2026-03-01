const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({ take: 20 });
  console.log('客户数量:', customers.length);
  
  customers.forEach((c) => {
    const fieldNames = ['name','occupation','city','painPoints','needs','scenes','language','lifestyle'];
    const fields = [c.name, c.occupation, c.city, c.painPoints, c.needs, c.scenes, c.language, c.lifestyle];
    
    fields.forEach((f, fi) => {
      if (!f) return;
      const hasCtrl = f.split('').some(ch => ch.charCodeAt(0) < 32 && ch !== '\n' && ch !== '\r' && ch !== '\t');
      const hasNewline = f.includes('\n');
      if (hasCtrl || hasNewline) {
        console.log('客户', c.name, '字段', fieldNames[fi], '含特殊字符 ctrl:', hasCtrl, 'newline:', hasNewline);
        console.log('  内容:', JSON.stringify(f.substring(0, 80)));
      }
    });
  });
  
  console.log('检查完毕');
  await prisma.$disconnect();
}

main().catch(console.error);
