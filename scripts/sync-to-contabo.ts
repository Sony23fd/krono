import { Client } from 'ssh2';
import * as fs from 'fs';

const conn = new Client();

const config = {
  host: '37.60.249.75',
  port: 22,
  username: 'root',
  password: 'Aliwdansaa23',
  readyTimeout: 99999
};

console.log('Connecting to Contabo via SSH...');

conn.on('ready', () => {
  console.log('Client :: ready');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;

    console.log('Uploading catalog.json...');
    sftp.fastPut('catalog.json', '/var/www/bileg/catalog.json', {}, (err) => {
      if (err) throw err;
      console.log('Uploaded catalog.json successfully.');

      console.log('Uploading import-catalog.ts...');
      sftp.fastPut('scripts/import-catalog.ts', '/var/www/bileg/scripts/import-catalog.ts', {}, (err) => {
        if (err) throw err;
        console.log('Uploaded import-catalog.ts successfully.');

        console.log('Uploading uploads.zip (this might take a minute)...');
        sftp.fastPut('uploads.zip', '/var/www/bileg/uploads.zip', {}, (err) => {
          if (err) throw err;
          console.log('Uploaded uploads.zip successfully.');

          // Now execute the commands
          console.log('Executing commands on remote server...');
          conn.exec('cd /var/www/bileg && unzip -o uploads.zip -d public/ && npx tsx scripts/import-catalog.ts', (err, stream) => {
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
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH connection error:', err);
}).connect(config);
