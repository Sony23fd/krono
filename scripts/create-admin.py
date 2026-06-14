import paramiko
import bcrypt
import sys

hashed = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8')

sql = f"""
INSERT INTO "User" (id, email, name, password, role, "updatedAt") 
VALUES ('admin_seed', 'admin@shop.mn', 'Админ', '{hashed}', 'ADMIN', NOW())
ON CONFLICT (email) DO UPDATE SET password = '{hashed}', role = 'ADMIN';
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('13.140.175.47', username='root', password='Aliwdansaa23', timeout=30)
cmd = f"""cat << 'EOF' > /tmp/admin.sql
{sql}
EOF
docker cp /tmp/admin.sql krono_db:/tmp/admin.sql
docker exec krono_db psql -U postgres -d krono -f /tmp/admin.sql
"""
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))
ssh.close()
