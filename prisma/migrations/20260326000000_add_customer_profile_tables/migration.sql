-- Sprint 1: 扩展客户画像表结构
-- 增量迁移：只新增字段和表，不修改/删除现有结构

-- === 1. 扩展 Customer 表：新增字段 ===
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "platform" TEXT DEFAULT 'xiaohongshu';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "personaName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "personaDesc" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tier3Eligible" BOOLEAN NOT NULL DEFAULT false;

-- === 2. 扩展 Material 表：新增字段 ===
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "styleTags" JSONB;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "tierLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "weeklyRefCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "dailyRefCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "maxDailyRef" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "colorTone" TEXT;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "season" TEXT;
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- === 3. 新建 PublishHabit 表 ===
CREATE TABLE IF NOT EXISTS "PublishHabit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "preferredTimeSlots" JSONB,
    "dailyPostCount" INTEGER NOT NULL DEFAULT 3,
    "imageTextRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "contentLengthPref" TEXT NOT NULL DEFAULT 'medium',
    "hashtagStyle" TEXT NOT NULL DEFAULT 'mixed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublishHabit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PublishHabit_customerId_key" ON "PublishHabit"("customerId");
ALTER TABLE "PublishHabit" DROP CONSTRAINT IF EXISTS "PublishHabit_customerId_fkey";
ALTER TABLE "PublishHabit" ADD CONSTRAINT "PublishHabit_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- === 4. 新建 ContentPreference 表 ===
CREATE TABLE IF NOT EXISTS "ContentPreference" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "preferredConstitutions" JSONB,
    "preferredProducts" JSONB,
    "topicTags" JSONB,
    "avoidTopics" JSONB,
    "seasonalFocus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentPreference_customerId_key" ON "ContentPreference"("customerId");
ALTER TABLE "ContentPreference" DROP CONSTRAINT IF EXISTS "ContentPreference_customerId_fkey";
ALTER TABLE "ContentPreference" ADD CONSTRAINT "ContentPreference_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- === 5. 新建 WritingStyle 表 ===
CREATE TABLE IF NOT EXISTS "WritingStyle" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'warm',
    "catchphrases" JSONB,
    "sentencePatterns" JSONB,
    "styleSamples" JSONB,
    "emojiFrequency" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WritingStyle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WritingStyle_customerId_key" ON "WritingStyle"("customerId");
ALTER TABLE "WritingStyle" DROP CONSTRAINT IF EXISTS "WritingStyle_customerId_fkey";
ALTER TABLE "WritingStyle" ADD CONSTRAINT "WritingStyle_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- === 6. 新建 TrendTracking 表 ===
CREATE TABLE IF NOT EXISTS "TrendTracking" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "industryKeywords" JSONB,
    "seasonalTopics" JSONB,
    "trendingResponse" TEXT NOT NULL DEFAULT 'moderate',
    "externalFeeds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrendTracking_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TrendTracking_customerId_key" ON "TrendTracking"("customerId");
ALTER TABLE "TrendTracking" DROP CONSTRAINT IF EXISTS "TrendTracking_customerId_fkey";
ALTER TABLE "TrendTracking" ADD CONSTRAINT "TrendTracking_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- === 7. 新建 PerformanceMetric 表 ===
CREATE TABLE IF NOT EXISTS "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "avgLikeRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgCommentRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgShareRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestContentTypes" JSONB,
    "bestPostTimes" JSONB,
    "totalPosts" INTEGER NOT NULL DEFAULT 0,
    "viralCount" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PerformanceMetric_customerId_key" ON "PerformanceMetric"("customerId");
ALTER TABLE "PerformanceMetric" DROP CONSTRAINT IF EXISTS "PerformanceMetric_customerId_fkey";
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- === 8. 新建 ContentHistory 表 ===
CREATE TABLE IF NOT EXISTS "ContentHistory" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "originalCopyId" TEXT,
    "cleanedCopy" TEXT,
    "imageUrls" JSONB,
    "visualFingerprint" JSONB,
    "platform" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "productIds" JSONB,
    "scheduledTime" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hashtags" JSONB,
    "engagement" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContentHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContentHistory_customerId_idx" ON "ContentHistory"("customerId");
CREATE INDEX IF NOT EXISTS "ContentHistory_platform_idx" ON "ContentHistory"("platform");
CREATE INDEX IF NOT EXISTS "ContentHistory_contentType_idx" ON "ContentHistory"("contentType");
CREATE INDEX IF NOT EXISTS "ContentHistory_status_idx" ON "ContentHistory"("status");
CREATE INDEX IF NOT EXISTS "ContentHistory_publishedAt_idx" ON "ContentHistory"("publishedAt");
ALTER TABLE "ContentHistory" DROP CONSTRAINT IF EXISTS "ContentHistory_customerId_fkey";
ALTER TABLE "ContentHistory" ADD CONSTRAINT "ContentHistory_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
