# 🚀 Deployment Guide: SIMRS Edge on GCP Ubuntu

This guide will help you deploy the **SIMRS Edge Offline Node** to a Google Cloud Platform (GCP) Compute Engine instance running Ubuntu.

## Prerequisites

*   A GCP Account with billing enabled.
*   Access to the GCP Console.
*   Basic familiarity with the terminal.

---

## Step 1: Create a VM Instance

1.  Go to **Compute Engine** > **VM instances**.
2.  Click **Create Instance**.
3.  **Name**: `simrs-edge-server`
4.  **Region**: `asia-southeast2` (Jakarta) or your preferred region.
5.  **Machine Type**: `e2-medium` (2 vCPU, 4GB memory) is recommended for Next.js build processes.
6.  **Boot Disk**: Ubuntu 22.04 LTS (x86/64).
7.  **Firewall**: Check both **Allow HTTP traffic** and **Allow HTTPS traffic**.
8.  Click **Create**.

## Step 2: Connect to the Server

Click **SSH** on your new instance in the GCP Console to open a browser-based terminal.

## Step 3: Install Dependencies

Run the following commands to install Node.js, Nginx, and Git:

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Curl & Git
sudo apt install -y curl git nginx

# Install Node.js (v20 LTS recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v
npm -v
```

## Step 4: Install PM2 (Process Manager)

PM2 keeps your application running in the background.

```bash
sudo npm install -g pm2
```

## Step 5: Deploy the Code

You can either clone from Git or upload your files manually.

### Option A: Clone from Git (Recommended)

```bash
git clone <YOUR_REPOSITORY_URL>
cd demo-edge-offline-node
```

### Option B: Upload Manually (if no Git repo)
Use the "Upload File" feature in the SSH window gear icon to upload a zipped project loop, then unzip it.

## Step 6: Build the Application

```bash
# Install dependencies
npm install

# Build the Next.js app
npm run build
```

## Step 7: Start with PM2

We included an `ecosystem.config.js` file for easy startup.

```bash
# Start the app
pm2 start ecosystem.config.js

# Save the process list to restart on reboot
pm2 save
pm2 startup
```

## Step 8: Configure Nginx (Reverse Proxy)

Nginx will forward public traffic (Port 80) to your app (Port 3000).

1.  Create a configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/default
    ```

2.  Replace the contents with the example provided in `nginx.conf.example`.

3.  Restart Nginx:
    ```bash
    sudo systemctl restart nginx
    ```

## Step 9: Verify

Open your browser and visit the **External IP** of your GCP instance. You should see the SIMRS Edge application running!

---

### Optional: SSL (HTTPS) with Certbot

If you have a domain name pointed to this IP:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
