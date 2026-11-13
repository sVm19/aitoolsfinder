#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/build-and-push.sh <dockerhub-username> [tag]"
  exit 1
fi

USERNAME="$1"
TAG="${2:-latest}"

echo "==========================================================="
echo "Building and pushing AIToolsFinder images to Docker Hub"
echo "Docker Hub Username: $USERNAME"
echo "Image Tag: $TAG"
echo "Target Architecture: linux/amd64 (EC2 Standard)"
echo "==========================================================="

echo -e "\n[1/3] Building backend image..."
docker buildx build --platform linux/amd64 \
  -t "$USERNAME/aitoolsfinder-backend:$TAG" \
  -f backend/Dockerfile backend --push

echo -e "\n[2/3] Building frontend image..."
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_APP_URL="https://aitoolsfinder.cloud" \
  --build-arg NEXT_PUBLIC_API_BASE_URL="https://aitoolsfinder.cloud/api/v1" \
  -t "$USERNAME/aitoolsfinder-frontend:$TAG" \
  -f frontend/Dockerfile frontend --push

echo -e "\n[3/3] Building nginx reverse proxy image..."
docker buildx build --platform linux/amd64 \
  -t "$USERNAME/aitoolsfinder-nginx:$TAG" \
  -f deploy/nginx/Dockerfile deploy/nginx --push

echo "==========================================================="
echo "SUCCESS: All 3 images pushed to Docker Hub!"
echo "==========================================================="
