# Deployment and Operations

## 1. Initial target
One AWS EC2 instance running Docker Compose for the Next.js and FastAPI containers, behind Nginx. S3 and CloudFront handle media. Cognito handles identity.

PostgreSQL hosting must be explicitly selected. If self-hosted on EC2, configure persistent volumes, backups, private networking and recovery. A managed database may have additional costs and should be evaluated separately.

## 2. Containers
- Frontend image: production Next.js build.
- Backend image: FastAPI served by Uvicorn.
- Optional worker image/process for scheduled tasks.
- Nginx routes `/` to frontend and `/api/` to backend.

Use non-root users, pinned dependencies, small base images, health checks and immutable image tags.

## 3. Environment variables
Maintain `.env.example` with names and descriptions, never real values. Examples:
- `DATABASE_URL`
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_APP_CLIENT_ID`
- `AWS_REGION`
- `S3_BUCKET_NAME`
- `CLOUDFRONT_DOMAIN`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `TIUN_API_KEY`
- `TIUN_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_API_BASE_URL`

Only variables explicitly safe for browser use may use the `NEXT_PUBLIC_` prefix.

## 4. CI/CD
GitHub Actions pipeline:
1. Install dependencies.
2. Lint and type-check frontend.
3. Run frontend unit tests.
4. Run backend lint/type checks and Pytest.
5. Build Docker images.
6. Scan dependencies/images.
7. Push versioned images to registry.
8. Deploy to EC2 through a secure, restricted deployment mechanism.
9. Run health checks.
10. Roll back to previous image if health checks fail.

Do not store long-lived AWS access keys in repository secrets if GitHub OIDC and an appropriately scoped IAM role can be used.

## 5. Operations
- Configure CloudWatch logs/metrics.
- Configure AWS Budgets and billing alerts.
- Monitor disk, memory, CPU and container restarts.
- Rotate logs.
- Back up database and test restore.
- Keep staging and production environments separate where feasible.
- Restrict SSH access and avoid exposing database ports.

## 6. Free-tier caution
AWS Free Tier eligibility and allowances depend on account age, service, region and current AWS terms. EC2, S3, CloudFront, data transfer, public IPv4, logs and other resources may generate charges. Check the AWS pricing pages and Billing console before provisioning.
