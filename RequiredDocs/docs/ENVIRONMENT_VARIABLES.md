# Environment Variables

This document lists expected variable names. Values belong in local environment files or a secure secret store and must never be committed.

## Backend
- `APP_ENV`
- `APP_SECRET_KEY`
- `DATABASE_URL`
- `CORS_ORIGINS`
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
- `LOG_LEVEL`

## Frontend
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- Cognito public configuration required by the chosen frontend auth flow

Do not expose secret keys through `NEXT_PUBLIC_` variables.

## Rules
- Commit `.env.example` with placeholder values only.
- Keep `.env` files ignored by Git.
- Use different credentials for local, staging and production.
- Rotate credentials if exposed.
- Validate required settings at application startup.
