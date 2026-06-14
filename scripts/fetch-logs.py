import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 20 krono_web', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
ssh.close()
