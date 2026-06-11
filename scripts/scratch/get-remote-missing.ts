import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to execute commands...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  const scriptContent = `
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const db = new PrismaClient();
async function main() {
  const lastSyncProduct = await db.product.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (!lastSyncProduct) return;
  const cutoff = new Date(lastSyncProduct.updatedAt.getTime() - 2 * 60 * 60 * 1000); // 2 hours before last sync
  
  const missing = await db.product.findMany({
    where: { updatedAt: { lt: cutoff } },
    select: { sku: true, name: true, stockQuantity: true, status: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' }
  });
  
  let csv = '\\uFEFFSKU,Нэр,Үлдэгдэл,Төлөв,Сүүлд шинэчлэгдсэн\\n';
  missing.forEach(p => {
    // Escape quotes and wrap name in quotes to handle commas in names
    const safeName = '"' + p.name.replace(/"/g, '""') + '"';
    csv += \`\${p.sku},\${safeName},\${p.stockQuantity},\${p.status},\${p.updatedAt.toISOString()}\\n\`;
  });
  
  fs.writeFileSync('/var/www/bileg/public/pos-missing-products.csv', csv, 'utf8');
  console.log('Saved to /var/www/bileg/public/pos-missing-products.csv. Total missing: ' + missing.length);
}
main().catch(console.error).finally(() => db.$disconnect());
  `;

  // Write script to file then execute
  const command = `
cat << 'EOF' > /var/www/bileg/find-missing.ts
${scriptContent}
EOF
cd /var/www/bileg && npx tsx find-missing.ts
  `;

  console.log('Executing command on remote server...');
  conn.exec(command, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code: any, signal: any) => {
      console.log('Remote execution finished. Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data: any) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data: any) => {
      console.log('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect(config);
