# Deployment Guide

## Quick Setup

### 1. GitHub Secrets Setup

Add these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_HOST` | EC2 instance IP or domain | `ec2-xx-xx-xx-xx.compute-1.amazonaws.com` |
| `EC2_USER` | SSH username | `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key content | Full private key with headers |
| `EC2_DEPLOY_PATH` | Deployment directory | `/var/www/html` |
| `VITE_API_BASE_URL` | API base URL (optional) | `https://api.example.com` |

### 2. EC2 Instance Setup

#### Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
```

#### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/default
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name _;

    root /var/www/html/current;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Set Permissions
```bash
sudo mkdir -p /var/www/html
sudo chown -R $USER:$USER /var/www/html
sudo chmod -R 755 /var/www/html
```

#### Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. SSH Key Setup

1. Generate SSH key (on your local machine):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_deploy
```

2. Copy public key to EC2:
```bash
ssh-copy-id -i ~/.ssh/github_deploy.pub ubuntu@your-ec2-ip
```

3. Test connection:
```bash
ssh -i ~/.ssh/github_deploy ubuntu@your-ec2-ip
```

4. Add private key to GitHub Secrets:
   - Copy the entire content of `~/.ssh/github_deploy` (private key)
   - Paste it into GitHub Secrets as `EC2_SSH_KEY`

### 4. Security Group Configuration

Ensure your EC2 security group allows:
- **Port 22 (SSH)**: From GitHub Actions IPs or your IP
- **Port 80 (HTTP)**: From anywhere (0.0.0.0/0)
- **Port 443 (HTTPS)**: From anywhere (if using SSL)

## Deployment Process

1. Push to `main` or `master` branch
2. GitHub Actions will automatically:
   - Build the application
   - Deploy to EC2
   - Reload nginx

## Manual Deployment

You can also trigger deployment manually:
1. Go to Actions tab in GitHub
2. Select "Deploy to EC2" workflow
3. Click "Run workflow"

## Environment Variables

If your app needs environment variables, you can:
1. Add them to GitHub Secrets
2. Update the workflow to pass them during build
3. Or create a `.env` file on the EC2 server

## SSL/HTTPS Setup (Optional)

To add SSL certificate with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Monitoring

Check deployment status:
```bash
# On EC2
ls -la /var/www/html/current
sudo systemctl status nginx
```

View logs:
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## Rollback

If deployment fails, you can manually rollback:
```bash
# On EC2
cd /var/www/html
sudo mv current current-failed
sudo mv backup-YYYYMMDD-HHMMSS current
sudo systemctl reload nginx
```

