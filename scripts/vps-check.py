import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)

stdin, stdout, stderr = ssh.exec_command('docker ps', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

stdin2, stdout2, stderr2 = ssh.exec_command('curl -s -o /dev/null -w "%{http_code}" http://localhost:80/', timeout=15)
code = stdout2.read().decode('utf-8', errors='replace')
print(f"HTTP Status: {code}")

ssh.close()
