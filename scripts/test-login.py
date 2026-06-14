import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
cmd = "curl -s -X POST -H 'Content-Type: application/json' -d '{\"email\":\"admin@shop.mn\",\"password\":\"admin123\"}' http://localhost:80/api/admin/login"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
