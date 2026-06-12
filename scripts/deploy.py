import paramiko
import time
import sys
import os
import zipfile

sys.stdout.reconfigure(encoding='utf-8')

def create_zip(zip_path, source_dir):
    print(f"Creating zip file {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '.next', 'backups', 'pos-agent', '.gemini']]
            
            # exclude public/uploads
            if 'public' in root and 'uploads' in dirs:
                dirs.remove('uploads')
                
            for file in files:
                # exclude the zip itself
                if file.endswith('.zip'): continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, rel_path)
    print("Zip file created.", flush=True)

def run_ssh_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            print(stdout.channel.recv(1024).decode('utf-8', errors='ignore'), end='')
        if stderr.channel.recv_stderr_ready():
            print(stderr.channel.recv_stderr(1024).decode('utf-8', errors='ignore'), file=sys.stderr, end='')
        time.sleep(0.1)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out, end='')
    if err: print(err, file=sys.stderr, end='')
    
    status = stdout.channel.recv_exit_status()
    print(f"Exit status: {status}\n")
    return status

def main():
    host = '13.140.175.47'
    user = 'root'
    password = 'Aliwdansaa23'

    source_dir = r"d:\tursh\krono"
    zip_path = r"d:\tursh\krono\deploy.zip"
    
    create_zip(zip_path, source_dir)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting to VPS...")
    ssh.connect(host, username=user, password=password)
    print("Connected.")

    print("Uploading zip file...")
    sftp = ssh.open_sftp()
    sftp.put(zip_path, '/root/deploy.zip')
    sftp.close()
    print("Upload complete.")

    env_content = """DATABASE_URL="postgresql://postgres:secretpassword@db:5432/krono?schema=public"
SESSION_SECRET="shoooop-super-secret-key-32-chars-minimum-length-required!"
NEXTAUTH_SECRET="engiinshop-super-secret-key-32-chars!"
NEXTAUTH_URL="http://13.140.175.47"
QPAY_CLIENT_ID="BILEGHURGELT"
QPAY_CLIENT_SECRET="k04dMExt"
QPAY_INVOICE_CODE="BILEGHURGELT_INVOICE"
QPAY_BASE_URL="https://merchant.qpay.mn/v2"
NEXT_PUBLIC_APP_URL="http://13.140.175.47"
VERIFY_MN_API_KEY="vrf_9rokHcZDkzWp5gun1-YOiDrHH7-E6njn"
POS_SYNC_API_KEY="super_secret_pos_key_2026"
"""

    commands = [
        "if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh; fi",
        "apt-get update && apt-get install -y unzip",
        "rm -rf /opt/krono",
        "mkdir -p /opt/krono",
        "unzip -o /root/deploy.zip -d /opt/krono > /dev/null",
        f"cat << 'EOF' > /opt/krono/.env\n{env_content}\nEOF",
        "cd /opt/krono && docker compose up -d --build",
        "sleep 15",
        "cd /opt/krono && docker exec krono_web npx prisma db push --accept-data-loss",
    ]

    for cmd in commands:
        status = run_ssh_cmd(ssh, cmd)
        if status != 0:
            print(f"Command failed with status {status}")

    ssh.close()
    try:
        os.remove(zip_path)
    except:
        pass
    print("Deployment script finished.")

if __name__ == '__main__':
    main()
