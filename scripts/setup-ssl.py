import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)

commands = [
    # 1. Update code and apply port change
    "cd /root/krono && git pull && docker compose up -d",
    
    # 2. Install Nginx and Certbot
    "apt update && DEBIAN_FRONTEND=noninteractive apt install -y nginx certbot python3-certbot-nginx",
    
    # 3. Create Nginx config
    """cat << 'EOF' > /etc/nginx/sites-available/kronoventure.com
server {
    server_name kronoventure.com www.kronoventure.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF""",
    
    # 4. Enable site and restart Nginx
    "ln -sf /etc/nginx/sites-available/kronoventure.com /etc/nginx/sites-enabled/",
    "systemctl restart nginx",
    
    # 5. Run Certbot
    "certbot --nginx -d kronoventure.com -d www.kronoventure.com --non-interactive --agree-tos -m admin@kronoventure.com --redirect"
]

for cmd in commands:
    print("Running:", cmd.split('\\n')[0][:50], "...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip(): print(out)
    if err.strip(): print("ERR:", err)

ssh.close()
print("SSL setup complete!")
