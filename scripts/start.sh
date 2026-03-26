#!/bin/sh
set -e

echo "========================================="
echo "  Step 1: Prisma DB Push"
echo "========================================="
npx prisma db push --skip-generate 2>&1 || {
  echo "WARNING: prisma db push failed, continuing anyway..."
}

echo "========================================="
echo "  Step 2: Initialize Customer Profiles"
echo "========================================="
node scripts/init-customer-profiles.js 2>&1 || {
  echo "WARNING: init-customer-profiles failed, continuing anyway..."
}

echo "========================================="
echo "  Step 3: Starting Node.js Server"
echo "========================================="
exec node server.js
