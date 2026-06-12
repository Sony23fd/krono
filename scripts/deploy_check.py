import paramiko
import time
import sys

def run_ssh_cmd(ssh, cmd):
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            try:
                print(stdout.channel.recv(1024).decode('utf-8', errors='ignore'), end='', flush=True)
            except:
                pass
        if stderr.channel.recv_stderr_ready():
            try:
                print(stderr.channel.recv_stderr(1024).decode('utf-8', errors='ignore'), file=sys.stderr, end='', flush=True)
            except:
                pass
        time.sleep(0.1)
    
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    if out: print(out, end='')
    if err: print(err, file=sys.stderr, end='')
    
    status = stdout.channel.recv_exit_status()
    print(f"\nExit status: {status}\n")
    return status

def main():
    host = '13.140.175.47'
    user = 'root'
    password = 'Aliwdansaa23'

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting to VPS...")
    ssh.connect(host, username=user, password=password)
    print("Connected.")

    print("Uploading fixed file...")
    sftp = ssh.open_sftp()
    ssh.exec_command("mkdir -p '/opt/krono/src/app/(storefront)/product/[id]'")
    sftp.put(r"d:\tursh\krono\src\app\(storefront)\product\[id]\ProductOrderForm.tsx", '/opt/krono/src/app/(storefront)/product/[id]/ProductOrderForm.tsx')
    sftp.close()
    print("Upload complete.")

    # Just run the remaining commands to be sure
    commands = [
        "cd /opt/krono && docker compose build",
        "cd /opt/krono && docker compose up -d",
        "sleep 10",
        "cd /opt/krono && docker exec krono_web npx prisma db push --accept-data-loss",
    ]

    for cmd in commands:
        status = run_ssh_cmd(ssh, cmd)
        if status != 0:
            print(f"Command failed with status {status}")

    ssh.close()
    print("Deployment script finished.")

if __name__ == '__main__':
    main()
