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
  const deployCmd = 'cat /var/log/nginx/error.log | tail -n 20';
  
  conn.exec(deployCmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code: any, signal: any) => {
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
