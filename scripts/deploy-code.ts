import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to deploy code...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  console.log('Executing deployment commands on remote server...');
  const deployCmd = 'cd /var/www/bileg && git pull && npm install && npx prisma db push && npx prisma generate && npm run build && pm2 restart all';
  
  conn.exec(deployCmd, (err, stream) => {
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
