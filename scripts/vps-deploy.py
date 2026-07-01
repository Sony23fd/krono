"""
VPS Deploy Script - Connects to VPS via SSH, pulls code from GitHub, and runs docker compose.
"""
import paramiko
import sys
import time
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

VPS_HOST = "13.140.175.47"
VPS_USER = "root"
VPS_PASS = "Aliwdansaa23"
PROJECT_DIR = "/root/krono"
REPO_URL = "https://github.com/Sony23fd/krono.git"

def run_ssh_command(ssh, cmd, timeout=300):
    print(f"\n{'='*60}")
    print(f"[CMD] {cmd}")
    print(f"{'='*60}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    
    # Read output
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    exit_code = stdout.channel.recv_exit_status()
    
    if out.strip():
        print(out)
    if err.strip():
        print(f"[STDERR] {err}")
    
    print(f"[EXIT CODE] {exit_code}")
    return exit_code, out, err

def main():
    print(f"Connecting to {VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("Connected!")
        
        # Step 1: Check if project exists, clone or pull
        exit_code, out, _ = run_ssh_command(ssh, f"test -d {PROJECT_DIR} && echo EXISTS || echo NOT_EXISTS")
        
        if "NOT_EXISTS" in out:
            print("\n>> Cloning repository...")
            run_ssh_command(ssh, f"cd /root && git clone {REPO_URL}")
        else:
            print("\n>> Pulling latest code...")
            run_ssh_command(ssh, f"cd {PROJECT_DIR} && git fetch origin && git reset --hard origin/main")
        
        # Step 2: Copy docker-compose.yml with updated env vars
        print("\n>> Uploading docker-compose.yml...")
        sftp = ssh.open_sftp()
        sftp.put(r"d:\tursh\krono\docker-compose.yml", f"{PROJECT_DIR}/docker-compose.yml")
        sftp.close()
        print("docker-compose.yml uploaded!")
        
        # Step 3: Install docker & docker-compose if not present
        run_ssh_command(ssh, "which docker || (apt-get update && apt-get install -y docker.io docker-compose)")
        
        # Step 4: Stop existing containers
        print("\n>> Stopping existing containers...")
        run_ssh_command(ssh, f"cd {PROJECT_DIR} && docker compose down || docker-compose down || true")
        
        # Step 5: Build and start
        print("\n>> Building and starting containers (this may take several minutes)...")
        exit_code, out, err = run_ssh_command(ssh, f"cd {PROJECT_DIR} && docker compose up -d --build 2>&1", timeout=600)
        
        if exit_code != 0:
            # Try docker-compose (hyphenated version)
            print("\n>> Trying docker-compose (legacy)...")
            run_ssh_command(ssh, f"cd {PROJECT_DIR} && docker-compose up -d --build 2>&1", timeout=600)
        
        # Step 6: Run prisma migrations
        print("\n>> Running database migrations...")
        time.sleep(10)  # Wait for DB to be ready
        run_ssh_command(ssh, f"cd {PROJECT_DIR} && docker compose exec web npx prisma@5.22.0 db push --accept-data-loss 2>&1 || docker-compose exec web npx prisma@5.22.0 db push --accept-data-loss 2>&1", timeout=120)
        
        # Step 7: Check status
        print("\n>> Checking container status...")
        run_ssh_command(ssh, "docker ps")
        
        print(f"\n{'='*60}")
        print(f"DEPLOY COMPLETE! Site should be at: http://{VPS_HOST}")
        print(f"{'='*60}")
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
