import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
stdin, stdout, stderr = ssh.exec_command("curl -s -i http://localhost:80/admin/login", timeout=30)
print(stdout.read().decode('utf-8', errors='replace')[:500])
ssh.close()
