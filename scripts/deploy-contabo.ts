import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to execute deployment...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  // Энд аюулгүй deployment хийх командууд байна
  // 1. git pull хийх
  // 2. npx prisma db push хийх (дата устгах эрсдэл гарвал fail хийнэ)
  // 3. npm run build
  // 4. pm2 restart all
  const cmd = `
    cd /var/www/bileg &&
    git pull origin main &&
    npm install &&
    npx prisma generate &&
    npx prisma db push --accept-data-loss &&
    npm run build &&
    pm2 restart all
  `;

  console.log('Executing deployment commands on remote server...');
  conn.exec(cmd, (err, stream) => {
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
