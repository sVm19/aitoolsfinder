param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "Building and pushing AIToolsFinder images to Docker Hub" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $Username" -ForegroundColor Yellow
Write-Host "Image Tag: $Tag" -ForegroundColor Yellow
Write-Host "Target Architecture: linux/amd64 (EC2 Standard)" -ForegroundColor Yellow
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Build and push Backend image
Write-Host "`n[1/3] Building backend image..." -ForegroundColor Green
docker buildx build --platform linux/amd64 `
    -t "$Username/aitoolsfinder-backend:$Tag" `
    -f backend/Dockerfile backend --push

# 2. Build and push Frontend image
Write-Host "`n[2/3] Building frontend image..." -ForegroundColor Green
docker buildx build --platform linux/amd64 `
    --build-arg NEXT_PUBLIC_APP_URL="https://aitoolsfinder.cloud" `
    --build-arg NEXT_PUBLIC_API_BASE_URL="https://aitoolsfinder.cloud/api/v1" `
    -t "$Username/aitoolsfinder-frontend:$Tag" `
    -f frontend/Dockerfile frontend --push

# 3. Build and push Nginx image
Write-Host "`n[3/3] Building nginx reverse proxy image..." -ForegroundColor Green
docker buildx build --platform linux/amd64 `
    -t "$Username/aitoolsfinder-nginx:$Tag" `
    -f deploy/nginx/Dockerfile deploy/nginx --push

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host "SUCCESS: All 3 images pushed to Docker Hub!" -ForegroundColor Green
Write-Host "  - $Username/aitoolsfinder-backend:$Tag"
Write-Host "  - $Username/aitoolsfinder-frontend:$Tag"
Write-Host "  - $Username/aitoolsfinder-nginx:$Tag"
Write-Host "===========================================================" -ForegroundColor Cyan
