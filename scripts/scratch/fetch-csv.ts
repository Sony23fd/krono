import { Client } from 'ssh2';
import fs from 'fs';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH to download CSV...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  conn.exec('cat /var/www/bileg/public/pos-missing-products.csv', (err, stream) => {
    if (err) throw err;
    let fileContent = '';
    stream.on('close', (code: any, signal: any) => {
      console.log('Remote execution finished. Saving to local workspace...');
      fs.writeFileSync('./pos-missing-products.csv', fileContent, 'utf8');
      console.log('Saved to d:\\tursh\\bileg\\pos-missing-products.csv');
      conn.end();
    }).on('data', (data: any) => {
      fileContent += data;
    }).stderr.on('data', (data: any) => {
      console.error('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect(config);
