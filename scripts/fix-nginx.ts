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
  // Check if client_max_body_size is already set, if not, add it to the http block
  const deployCmd = `
    if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
      sed -i 's/http {/http {\\n\\tclient_max_body_size 50M;/g' /etc/nginx/nginx.conf
      echo "Added client_max_body_size 50M"
    else
      sed -i -E 's/client_max_body_size [a-zA-Z0-9]+;/client_max_body_size 50M;/g' /etc/nginx/nginx.conf
      echo "Updated client_max_body_size to 50M"
    fi
    nginx -t && systemctl reload nginx
  `;
  
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
