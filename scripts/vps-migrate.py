import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
print('Connected!')

db_url = 'postgresql://postgres:secretpassword@localhost:5432/krono?schema=public'

cmd = (
    'cd /root/krono && '
    'DATABASE_URL="' + db_url + '" '
    'DIRECT_URL="' + db_url + '" '
    'npx prisma@5.22.0 db push --accept-data-loss 2>&1'
)

print('Running: prisma db push...')
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=180)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
ec = stdout.channel.recv_exit_status()

if out.strip():
    print(out)
if err.strip():
    print('STDERR:', err)
print('Exit:', ec)

ssh.close()
print('Done!')
