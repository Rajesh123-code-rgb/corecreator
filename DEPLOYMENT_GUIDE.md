# Deployment Guide: Hostinger VPS with Docker

This guide details how to deploy your "Core Creator" Next.js application to a Hostinger VPS that already hosts another application. We will use **Docker** to isolate your application and **Nginx** as a reverse proxy to route traffic.

## Prerequisites

1.  **Hostinger VPS Access**: valid IP address, username (usually `root`), and password/SSH key.
2.  **Domain Name**: A domain or subdomain pointing to your VPS IP address (e.g., `app.yourdomain.com`).
3.  **Docker Installed**: Ensure Docker and Docker Compose are installed on your VPS.

## Step 1: Prepare Your Local Environment

We have already configured your project for Docker deployment:
*   `next.config.ts`: Enabled `output: "standalone"`.
*   `Dockerfile`: Created a multi-stage build optimization.
*   `docker-compose.prod.yml`: Production configuration.
*   `deploy.sh`: Helper script.

## Step 2: Connect to Your VPS

Open your terminal and SSH into your VPS:
```bash
ssh root@<YOUR_VPS_IP>
```

## Step 3: Install Docker (If not already installed)

Run the following command to check if Docker is installed:
```bash
docker --version
```
If not installed, run:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## Step 4: Upload Your Code

You can use `git` to clone your repository or `scp` to upload files directly.

### Option A: Using Git (Recommended)
1.  Install Git: `apt update && apt install git -y`
2.  Clone your repo:
    ```bash
    cd /opt
    git clone <YOUR_REPO_URL> corecreator
    cd corecreator
    ```

### Option B: Using SCP (From your local machine)
If your code isn't on GitHub, upload it manually (excluding node_modules and .next):
```bash
scp -r . root@<YOUR_VPS_IP>:/opt/corecreator
```

## Step 5: Configure Environment Variables

1.  Navigate to your app directory:
    ```bash
    cd /opt/corecreator
    ```
2.  Create the production environment file:
    ```bash
    nano .env.production
    ```
3.  Paste your environment variables (e.g., specific to your app). *Note: Ensure you include any database connection strings.*
    ```env
    NEXTAUTH_URL=https://app.yourdomain.com
    NEXTAUTH_SECRET=<generate_a_secure_secret>
    # Add other variables from your .env.local
    ```
4.  Save and exit (Ctrl+O, Enter, Ctrl+X).

## Step 6: Deploy the Application

Run the deployment script:
```bash
chmod +x deploy.sh
./deploy.sh
```
This command will build the Docker image and start the container on port **3002**.

## Step 7: Configure Nginx Reverse Proxy

Since you already have an application running, you likely have Nginx installed. We need to create a new server block for your new app.

1.  Create a new Nginx config file:
    ```bash
    nano /etc/nginx/sites-available/corecreator
    ```
2.  Paste the following configuration (replace `app.yourdomain.com` with your actual domain):

    ```nginx
    server {
        listen 80;
        server_name app.yourdomain.com;

        location / {
            proxy_pass http://localhost:3002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  Enable the site:
    ```bash
    ln -s /etc/nginx/sites-available/corecreator /etc/nginx/sites-enabled/
    ```
4.  Test Nginx configuration:
    ```bash
    nginx -t
    ```
5.  Reload Nginx:
    ```bash
    systemctl reload nginx
    ```

## Step 8: Setup SSL (HTTPS)

Use Certbot to secure your domain with a free Let's Encrypt certificate.

1.  Install Certbot (if not installed):
    ```bash
    apt install certbot python3-certbot-nginx -y
    ```
2.  Obtain the certificate:
    ```bash
    certbot --nginx -d app.yourdomain.com
    ```
3.  Follow the prompts to redirect HTTP to HTTPS.

## Verification

Visit `https://app.yourdomain.com` in your browser. Your application should be live!

## Troubleshooting

*   **View Logs**: `docker logs -f corecreator_app`
*   **Restart App**: `./deploy.sh`
*   **Stop App**: `docker compose -f docker-compose.prod.yml down`
