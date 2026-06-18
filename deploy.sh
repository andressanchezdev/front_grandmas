#!/bin/bash
# Deploy Frontend to S3 + CloudFront
# Usage: ./deploy.sh [distribution-id]

set -e

BUCKET_NAME="grandmas-liquors-frontend"
REGION="us-east-2"
DISTRIBUTION_ID="${1:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed: dist folder not found${NC}"
  exit 1
fi

echo -e "${YELLOW}📤 Uploading to S3...${NC}"

# Upload all files with long cache
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --region $REGION \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude ".map" \
  --quiet

echo -e "${GREEN}✅ Static files uploaded${NC}"

# Upload index.html with no cache
echo -e "${YELLOW}📝 Uploading index.html (no cache)...${NC}"
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --region $REGION \
  --content-type "text/html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --quiet

echo -e "${GREEN}✅ index.html uploaded${NC}"

# Invalidate CloudFront cache if distribution ID provided
if [ -n "$DISTRIBUTION_ID" ]; then
  echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text
  echo -e "${GREEN}✅ Cache invalidation triggered${NC}"
else
  echo -e "${YELLOW}⚠️  Tip: Pass distribution ID as argument for cache invalidation${NC}"
  echo -e "${YELLOW}   Usage: ./deploy.sh d1a2b3c4d5e6f7${NC}"
fi

echo -e "${GREEN}✅ Deploy complete!${NC}"

# Get CloudFront URL
CLOUDFRONT_URL=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET_NAME.s3.$REGION.amazonaws.com']].DomainName" \
  --output text | head -1)

if [ -n "$CLOUDFRONT_URL" ]; then
  echo -e "${GREEN}🌐 Frontend available at: https://$CLOUDFRONT_URL${NC}"
fi
