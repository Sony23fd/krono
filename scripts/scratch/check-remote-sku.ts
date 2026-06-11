import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to check sku...');

conn.on('ready', () => {
  const scriptContent = `
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
db.product.findMany({ 
  where: { sku: { contains: '135015' } }, 
  select: { sku: true, name: true, status: true, id: true, createdAt: true, updatedAt: true } 
})
.then(res => console.log(JSON.stringify(res, null, 2)))
.catch(console.error)
.finally(() => db.$disconnect());
  `;

  const command = `
cat << 'EOF' > /var/www/bileg/check-sku.ts
${scriptContent}
EOF
cd /var/www/bileg && npx tsx check-sku.ts
  `;

  conn.exec(command, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code: any, signal: any) => {
      conn.end();
    }).on('data', (data: any) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data: any) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect(config);
