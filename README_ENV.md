# Environment Variables Setup

## Local Development

1. Copy the example file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and set your backend API URL:
   ```
   # For local development with local backend
   VITE_API_BASE_URL=http://localhost:3000
   
   # For production/development with AWS API Gateway
   VITE_API_BASE_URL=https://3e1g8aha8a.execute-api.ap-south-1.amazonaws.com
   
   VITE_ENV=dev
   ```

3. Restart your dev server if it's running:
   ```bash
   npm run dev
   ```

## Production/Deployment

### Option 1: Using GitHub Secrets (Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `VITE_API_BASE_URL`: Your production backend URL (e.g., `https://3e1g8aha8a.execute-api.ap-south-1.amazonaws.com`)
   - `VITE_ENV`: Environment name (e.g., `production`)

The workflow will automatically use these secrets during build.

### Option 2: Using .env file on EC2

1. Create a `.env` file on your EC2 server
2. Add your environment variables
3. The build process will use these values

## Available Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000` | `https://3e1g8aha8a.execute-api.ap-south-1.amazonaws.com` |
| `VITE_ENV` | Environment name | `dev` | `production` |

## Notes

- All Vite environment variables must be prefixed with `VITE_` to be exposed to the client
- The `.env` file is gitignored and won't be committed to the repository
- For production, always use GitHub Secrets to keep sensitive URLs secure

