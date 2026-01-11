# GitHub Actions Deployment Setup

This workflow deploys the application to an EC2 instance.

## Prerequisites

1. **EC2 Instance Setup:**
   - An EC2 instance running Ubuntu/Linux
   - Nginx or another web server installed
   - SSH access configured

2. **GitHub Secrets Configuration:**
   
   Go to your repository → Settings → Secrets and variables → Actions, and add the following secrets:

   - `EC2_HOST`: Your EC2 instance public IP or domain (e.g., `ec2-xx-xx-xx-xx.compute-1.amazonaws.com`)
   - `EC2_USER`: SSH username (usually `ubuntu` for Ubuntu, `ec2-user` for Amazon Linux)
   - `EC2_SSH_KEY`: Your private SSH key content (the entire private key, including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
   - `EC2_DEPLOY_PATH`: Path where the app will be deployed (e.g., `/var/www/html` or `/home/ubuntu/app`)
   - `VITE_API_BASE_URL`: (Optional) Your API base URL for the frontend

## EC2 Server Setup

### 1. Install Nginx (if not already installed)

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Configure Nginx

Create/edit `/etc/nginx/sites-available/default`:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 IP

    root /var/www/html/current;  # Update to match EC2_DEPLOY_PATH
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Add security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Set Permissions

```bash
sudo chown -R $USER:$USER /var/www/html
sudo chmod -R 755 /var/www/html
```

## SSH Key Setup

1. Generate an SSH key pair (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   ```

2. Copy the public key to your EC2 instance:
   ```bash
   ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-ec2-host
   ```

3. Add the **private key** content to GitHub Secrets as `EC2_SSH_KEY`

## Workflow Triggers

The workflow runs on:
- Push to `main` or `master` branch
- Manual trigger via GitHub Actions UI (workflow_dispatch)

## Customization

You can modify the workflow file (`.github/workflows/deploy.yml`) to:
- Change deployment path
- Add pre/post deployment scripts
- Configure different environments (staging/production)
- Add health checks
- Set up rollback mechanisms

## Troubleshooting

1. **SSH Connection Issues:**
   - Verify EC2 security group allows SSH (port 22) from GitHub Actions IPs
   - Check that the SSH key is correctly formatted in GitHub Secrets
   - Ensure the EC2_USER is correct for your instance type

2. **Permission Issues:**
   - Make sure the deployment path exists and has correct permissions
   - Check that nginx user has read access to the deployment directory

3. **Build Failures:**
   - Check that all environment variables are set in GitHub Secrets
   - Verify Node.js version compatibility

