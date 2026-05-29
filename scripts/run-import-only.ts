import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to push schema and execute import...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  console.log('Pushing schema and executing database import on remote server...');
  conn.exec('cd /var/www/bileg && npx prisma db push && npx prisma generate && npx tsx scripts/import-catalog.ts', (err, stream) => {
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
