import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo to fetch logs...');

conn.on('ready', () => {
  conn.exec('pm2 logs bileghurgelt --lines 50 --nostream', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('--- LOGS START ---');
      console.log(output);
      console.log('--- LOGS END ---');
      conn.end();
    }).on('data', (data: any) => {
      output += data;
    }).stderr.on('data', (data: any) => {
      output += data;
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect(config);
