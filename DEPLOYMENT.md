# AI Digital Twin Deployment Guide

## Prerequisites
- AWS CLI configured with credentials (`aws configure`)
- Docker installed and running
- Node.js 18+ installed
- Python 3.12+ with uv package manager
- Terraform installed

## Quick Deploy (Recommended)
```bash
# Deploy everything (infrastructure + frontend + backend)
./scripts/deploy.sh dev aitwin
```

## Environment Variables

### Backend (AWS Lambda)
- `CORS_ORIGINS`: Frontend URL(s) - Auto-configured by Terraform
- `S3_BUCKET`: Memory storage bucket - Auto-configured by Terraform  
- `USE_S3`: Set to "true" for persistent conversations
- `BEDROCK_MODEL_ID`: AWS Bedrock model ID (e.g., "amazon.nova-lite-v1:0")
- `DEFAULT_AWS_REGION`: AWS region (us-east-1)

### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: API Gateway URL - Auto-set by deploy script

## Complete Deployment Process

### Step 1: Build Lambda Package
```bash
cd backend
uv run deploy.py
```
- Creates `lambda-deployment.zip` with Python dependencies
- Uses Docker for Lambda-compatible environment
- Output: `backend/lambda-deployment.zip`

### Step 2: Deploy Infrastructure (Terraform)
```bash
cd terraform
terraform init
terraform workspace new dev  # or select existing
terraform apply -var-file="dev.tfvars"  # or use default
```

**Terraform Variables:**
- `project_name`: "aitwin" (your project identifier)
- `environment`: "dev" (deployment environment)
- `bedrock_model_id`: "amazon.nova-lite-v1:0"
- `lambda_timeout`: 30 (seconds)
- `api_throttle_rate`: 100 (requests per second)
- `use_custom_domain`: false (set to true for custom domain)
- `root_domain`: "" (required if use_custom_domain = true)

**Terraform Outputs (Current Deployment):**
```hcl
api_gateway_url = "https://ysew0zf0ji.execute-api.us-east-1.amazonaws.com"
cloudfront_url = "https://d2ux781n46vm50.cloudfront.net"
custom_domain_url = ""
lambda_function_name = "aitwin-dev-api"
s3_frontend_bucket = "aitwin-dev-frontend-443370708370"
s3_memory_bucket = "aitwin-dev-memory-443370708370"
```

### Step 3: Build Frontend
```bash
cd frontend
npm install
npm run build
```
- Creates static files in `out/` directory
- Uses production environment variables
- Output: Optimized HTML/CSS/JS files

### Step 4: Deploy Frontend to S3
```bash
# Upload to your specific S3 bucket
aws s3 sync out/ s3://aitwin-dev-frontend-443370708370/ --delete
```

### Step 5: Clear CloudFront Cache
```bash
# Force immediate update across all CDN edge locations
aws cloudfront create-invalidation --distribution-id E51NAE8X05X8H --paths "/*"
```

## AWS Resources Created

### S3 Buckets
- **Frontend Bucket**: `aitwin-dev-frontend-443370708370`
  - Purpose: Host static Next.js website
  - Public access: Enabled (via CloudFront)
  - Website hosting: Enabled

- **Memory Bucket**: `aitwin-dev-memory-443370708370`
  - Purpose: Store conversation history as JSON
  - Public access: Private (Lambda only)
  - Versioning: Disabled

### Lambda Function
- **Name**: `aitwin-dev-api`
- **Runtime**: Python 3.12
- **Handler**: `lambda_handler.handler`
- **Timeout**: 30 seconds
- **Memory**: 512 MB

### API Gateway
- **Type**: HTTP API
- **URL**: `https://ysew0zf0ji.execute-api.us-east-1.amazonaws.com`
- **CORS**: Configured for frontend domain
- **Throttling**: 100 requests per second

### CloudFront Distribution
- **Distribution ID**: `E51NAE8X05X8H`
- **Domain**: `d2ux781n46vm50.cloudfront.net`
- **Origin**: S3 frontend bucket
- **Cache TTL**: 24 hours (can be invalidated)

### IAM Role
- **Name**: `aitwin-dev-lambda-role`
- **Permissions**: 
  - AWSLambdaBasicExecutionRole
  - AmazonS3FullAccess
  - AmazonBedrockFullAccess

## Frontend Updates (Quick Commands)

When making changes to the frontend only:

```bash
# 1. Build updated frontend
cd frontend && npm run build

# 2. Upload to S3 (replace with your bucket name)
aws s3 sync out/ s3://aitwin-dev-frontend-443370708370/ --delete

# 3. Clear CloudFront cache (replace with your distribution ID)
aws cloudfront create-invalidation --distribution-id E51NAE8X05X8H --paths "/*"
```

## Placeholders vs Actual Values

| Item | Placeholder | Actual Value (This Deployment) |
|------|------------|--------------------------------|
| Project Name | `{project_name}` | `aitwin` |
| Environment | `{environment}` | `dev` |
| AWS Account ID | `{account_id}` | `443370708370` |
| Frontend Bucket | `{project_name}-{environment}-frontend-{account_id}` | `aitwin-dev-frontend-443370708370` |
| Memory Bucket | `{project_name}-{environment}-memory-{account_id}` | `aitwin-dev-memory-443370708370` |
| Lambda Function | `{project_name}-{environment}-api` | `aitwin-dev-api` |
| API Gateway URL | `{api_gateway_url}` | `https://ysew0zf0ji.execute-api.us-east-1.amazonaws.com` |
| CloudFront URL | `{cloudfront_url}` | `https://d2ux781n46vm50.cloudfront.net` |
| Distribution ID | `{distribution_id}` | `E51NAE8X05X8H` |

## Production Deployment

For production deployment with custom domain:

1. **Update `terraform/prod.tfvars`:**
```hcl
project_name = "aitwin"
environment = "prod"
bedrock_model_id = "amazon.nova-lite-v1:0"
lambda_timeout = 30
api_throttle_rate = 100
use_custom_domain = true
root_domain = "yourdomain.com"  # Replace with your domain
```

2. **Run production deployment:**
```bash
./scripts/deploy.sh prod aitwin
```

## Architecture Overview
- **Frontend**: Next.js static site on S3 + CloudFront CDN
- **Backend**: FastAPI on AWS Lambda with Mangum adapter
- **API**: API Gateway HTTP API with CORS configuration
- **Storage**: S3 for conversation memory (JSON files)
- **AI**: AWS Bedrock integration (Nova models)
- **Infrastructure**: Terraform for IaC deployment

## Live Application
- **URL**: https://d2ux781n46vm50.cloudfront.net
- **Status**: Production ready with modern green design
- **Features**: Full-screen chat interface, AWS Bedrock integration, persistent memory

## Troubleshooting

### Common Issues
1. **Docker not running**: Start Docker daemon before building Lambda
2. **CloudFront caching**: Use invalidation command to force updates
3. **CORS errors**: Check API Gateway CORS configuration
4. **S3 bucket permissions**: Verify bucket policy allows CloudFront access

### Useful Commands
```bash
# Check terraform outputs
cd terraform && terraform output

# View Lambda logs
aws logs tail /aws/lambda/aitwin-dev-api --follow

# Check S3 bucket contents
aws s3 ls s3://aitwin-dev-frontend-443370708370/

# Test API endpoint
curl https://ysew0zf0ji.execute-api.us-east-1.amazonaws.com/
```
