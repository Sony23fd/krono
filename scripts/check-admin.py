import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
stdin, stdout, stderr = ssh.exec_command('docker exec krono_db psql -U postgres -d krono -c "SELECT email, role FROM \\"User\\";"', timeout=30)
out = stdout.read().decode('utf-8', errors='replace')
print(out)

if "admin@shop.mn" not in out:
    print("Seeding...")
    stdin, stdout, stderr = ssh.exec_command('docker exec krono_web npx ts-node prisma/seed.ts', timeout=60)
    print(stdout.read().decode('utf-8', errors='replace'))
    print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()
