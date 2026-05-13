import paramiko
import os
import sys

# VPS Connection Info
HOST = '103.97.127.43'
PORT = 2018
USER = 'root'
PASSWORD = 'C106kAPh6s'

# Local File Paths
LOCAL_DB_PATH = r'd:\Học\Học AI\Second-Brain-AI\brain.db'

# Remote Paths
REMOTE_DIR = '/opt/my-website'
REPO_URL = 'https://github.com/dunghoangtien0504/Second-Brain-AI.git'

def run_remote_command(ssh, command):
    print(f"Running: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(f"Output: {out}")
    if err: print(f"Error: {err}")
    return exit_status, out, err

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {HOST}:{PORT}...")
        ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD)
        print("Connected successfully!")

        # 1. Install Node.js
        print("Checking for Node.js...")
        status, out, err = run_remote_command(ssh, "node -v")
        if status != 0:
            print("Node.js not found. Installing...")
            run_remote_command(ssh, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
            run_remote_command(ssh, "apt-get install -y nodejs")
        
        # 2. Clone or Update Repo
        run_remote_command(ssh, f"mkdir -p {REMOTE_DIR}")
        status, out, err = run_remote_command(ssh, f"ls {REMOTE_DIR}/.git")
        if status != 0:
            print("Cloning repository...")
            run_remote_command(ssh, f"git clone {REPO_URL} {REMOTE_DIR}")
        else:
            print("Updating repository...")
            run_remote_command(ssh, f"cd {REMOTE_DIR} && git pull origin main")

        # 3. npm install
        print("Installing dependencies...")
        run_remote_command(ssh, f"cd {REMOTE_DIR} && npm install")

        # 4. Create .env file
        print("Setting up .env file...")
        env_content = """PORT=3000
BANK_ID=MB
BANK_ACCOUNT_NO=333303838
BANK_ACCOUNT_NAME=HOANG TIEN DUNG
MAILERLITE_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMWE5OWY0YzYzZDJjMTA4ZWRkNGE4NGQxYWRiNjA3MDNmNDY1MTI1MGQ4OWEzMGZiNmQzMDdhYWU5MTU4YjcyNTY1MTVhNDBiMmYwOTg3MjYiLCJpYXQiOjE3Nzc3OTA3OTkuNDE2MjA0LCJuYmYiOjE3Nzc3OTA3OTkuNDE2MjA3LCJleHAiOjQ5MzM0NjQzOTkuMzk4MDI4LCJzdWIiOiIyMzMxNjI3Iiwic2NvcGVzIjpbXX0.Z3m1rD_X0lEBnAuHOSejbxacGEs7esePr3B8em0hMFZI1yIYmhoazzr7BtaacIKg6Zib2pLXE_kZj-FS37AmgkcLmIw7teoM_JPHIsHpAz56QHqHGvQYrHcskVO8tKoo8PpaYB7JMiXljx46VsMccHiOUY1XSCbv4exKIQRUeBEyEYaFec9JSZjDJOj0wdjAuf5gvkt6QlCH-7h7iT5xFnf4v_WGlCK49MXvMxzklbrDaML0_mUDj-mT3VA71uFgUXvf4rg_65bNmcfj9Hou4hZg7pdzSfO8kp2S16Hzf_dQxo49TCttaoAof03vWTr_GBpjrwV8hrFxMJfeE0-jdUd0LyF-sZSaZGj0tXvTVntBONu2oEz46qnuWbmjtO1ue-y8NQ-HKP7EVf7XGX1XNFHVtIsUNiElxhSKf1cleILetVBnZuQ0ZiQOkVMM4fdmUBvbuPYiEyEmuiXxdHsG_RfwyIi5JDZsdJDBNA8rJOFH9UsDgFitJvPfpBQ2L2IABFXk9RJbLSpPNkex6tMd3EbwDxNnaummN_OGiwbbg--ctHrSxMK6iLsRD_SV-pqKRk45ZnwMcH0uwN6gF7D2e26Lw41JzJU200W6VjckeiTz9_dWOONJ1IBBQQfPzlzXJiWnjVhJ91-X7lykIFEe_HQSl7BmQHe057Qwgjhsa30
MAILERLITE_GROUP_ID=186427233165903270
"""
        run_remote_command(ssh, f"cat <<EOF > {REMOTE_DIR}/.env\n{env_content}EOF")

        # 5. Upload brain.db
        print("Uploading brain.db...")
        sftp = ssh.open_sftp()
        sftp.put(LOCAL_DB_PATH, f"{REMOTE_DIR}/brain.db")
        sftp.close()
        print("Uploaded brain.db successfully.")

        # 6. Create systemd service
        print("Setting up systemd service...")
        service_content = f"""[Unit]
Description=Second Brain AI Website
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
"""
        run_remote_command(ssh, f"cat <<EOF > /etc/systemd/system/mywebsite.service\n{service_content}EOF")
        run_remote_command(ssh, "systemctl daemon-reload")
        run_remote_command(ssh, "systemctl enable mywebsite")
        run_remote_command(ssh, "systemctl restart mywebsite")

        # 7. Test
        print("Testing service...")
        status, out, err = run_remote_command(ssh, "curl -s http://localhost:3000 | head -n 5")
        if status == 0 and "html" in out.lower():
            print("Deployment SUCCESSFUL!")
        else:
            print("Deployment might have failed. Please check logs.")
            run_remote_command(ssh, "journalctl -u mywebsite --no-pager -n 20")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()
        print("Connection closed.")

if __name__ == '__main__':
    main()
