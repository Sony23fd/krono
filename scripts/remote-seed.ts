import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

conn.on('ready', () => {
  const seedCmd = 'cd /var/www/bileg && npx tsx scripts/seed-pos-script.ts';
  
  conn.exec(seedCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code: any, signal: any) => {
      console.log('Seed execution finished.');
      conn.end();
    }).on('data', (data: any) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data: any) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect(config);
