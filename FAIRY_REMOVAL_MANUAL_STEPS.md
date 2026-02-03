# Fairy Feature Removal - Manual Steps

This document lists manual steps required after merging the fairy removal code changes.

## Environment Variables to Delete

### GitHub Actions/Deploy Script

These were removed from `internal/scripts/deploy-dotcom.ts` - delete from GitHub secrets:

- `FAIRY_MODEL` - AI model for fairy feature
- `FAIRY_WORKER` - URL to the fairy worker service
- `FAIRY_WORKER_SENTRY_DSN` - Sentry DSN for fairy worker
- `DISCORD_FAIRY_PURCHASE_WEBHOOK_URL` - Discord webhook for purchase notifications
- `PADDLE_FAIRY_PRICE_ID` - Paddle price ID for fairy purchases

### Cloudflare Workers (sync-worker)

Delete from Cloudflare dashboard or wrangler.toml if set:

- `PADDLE_WEBHOOK_SECRET` - Can be kept if used for other Paddle products
- `PADDLE_ENVIRONMENT` - Can be kept if used for other Paddle products

### GitHub Actions Secrets

Delete from GitHub repository settings (Settings > Secrets and variables > Actions):

- `FAIRY_MODEL`
- `FAIRY_WORKER`
- `FAIRY_WORKER_SENTRY_DSN`
- `DISCORD_FAIRY_PURCHASE_WEBHOOK_URL`
- `PADDLE_FAIRY_PRICE_ID`
- Any other `FAIRY_*` prefixed secrets

### Cloudflare KV Namespaces

The `FEATURE_FLAGS` KV namespace may contain stale fairy flags. Optionally clean up:

- Key: `fairies`
- Key: `fairies_purchase`

## Cloudflare Workers to Delete

The fairy-worker code has been deleted from the repo. Delete the deployed service from Cloudflare:

1. Go to Cloudflare dashboard
2. Navigate to Workers & Pages
3. Find and delete workers matching these patterns:
   - `*-tldraw-fairy` (production, staging, preview)
4. Delete associated:
   - KV namespaces
   - R2 buckets
   - Durable Objects (AgentDurableObject)
   - Custom domains (`*-fairy.tldraw.xyz`)

## GitHub Actions Workflows

Check and update any workflows that reference:

- Fairy worker deployment
- Paddle integration testing
- Fairy-specific environment variables

## DNS/Routing

If there are custom domains or routes for:

- `fairy.tldraw.com` or similar
- `/api/fairy/*` routes in production

These can be removed from DNS and routing configuration.

## Database Tables (DO NOT DELETE)

The following tables are preserved for data integrity:

- `user_fairies`
- `file_fairies`
- `fairy_invite`
- `file_fairy_messages`
- `paddle_transactions`

These tables can be cleaned up later if needed, but should not be dropped immediately.

## Monitoring/Alerts

Remove or update any monitoring alerts for:

- Fairy worker health checks
- Paddle webhook failures
- Fairy-related error rates

## Third-Party Services

### Paddle

- Consider canceling/archiving the Paddle product if no longer needed
- Update webhook endpoints in Paddle dashboard
- Review billing/subscription settings

## Verification Checklist

After completing manual steps:

- [ ] Environment variables removed from Cloudflare
- [ ] GitHub secrets cleaned up
- [ ] Fairy worker deleted from Cloudflare
- [ ] No deployment errors in CI/CD
- [ ] `/pricing` route returns 404
- [ ] `/fairy-invite/:token` route returns 404
- [ ] Admin page loads without fairy section
- [ ] Editor loads without fairy UI
