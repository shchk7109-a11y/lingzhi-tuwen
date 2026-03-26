-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "occupation" TEXT,
    "city" TEXT,
    "income" TEXT,
    "category" TEXT NOT NULL DEFAULT '职场精英型',
    "lifestyle" TEXT,
    "painPoints" TEXT,
    "needs" TEXT,
    "scenes" TEXT,
    "language" TEXT,
    "xhsAccount" TEXT,
    "wechatAccount" TEXT,
    "wechatId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accountId" TEXT,
    "platform" TEXT DEFAULT 'xiaohongshu',
    "personaName" TEXT,
    "personaDesc" TEXT,
    "targetAudience" TEXT,
    "tier3Eligible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "webPath" TEXT NOT NULL,
    "productLine" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sceneType" TEXT NOT NULL DEFAULT '场景图',
    "tags" TEXT,
    "isFormula" BOOLEAN NOT NULL DEFAULT false,
    "isProduct" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "styleTags" JSONB,
    "tierLevel" INTEGER NOT NULL DEFAULT 1,
    "weeklyRefCount" INTEGER NOT NULL DEFAULT 0,
    "dailyRefCount" INTEGER NOT NULL DEFAULT 0,
    "maxDailyRef" INTEGER NOT NULL DEFAULT 8,
    "expiresAt" TIMESTAMP(3),
    "colorTone" TEXT,
    "season" TEXT,
    "category" TEXT,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "cleanedText" TEXT,
    "coverData" TEXT,
    "coverUrl" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "productName" TEXT,
    "productSlogan" TEXT,
    "coverStyle" TEXT,
    "matchedImage2" TEXT,
    "matchedImage3" TEXT,
    "image2Url" TEXT,
    "image3Url" TEXT,
    "image4Url" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'xhs',
    "tags" TEXT,
    "xhsAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishHabit" (
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

-- CreateTable
CREATE TABLE "ContentPreference" (
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

-- CreateTable
CREATE TABLE "WritingStyle" (
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

-- CreateTable
CREATE TABLE "TrendTracking" (
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

-- CreateTable
CREATE TABLE "PerformanceMetric" (
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

-- CreateTable
CREATE TABLE "ContentHistory" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_key_key" ON "Prompt"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PublishHabit_customerId_key" ON "PublishHabit"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPreference_customerId_key" ON "ContentPreference"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "WritingStyle_customerId_key" ON "WritingStyle"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrendTracking_customerId_key" ON "TrendTracking"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceMetric_customerId_key" ON "PerformanceMetric"("customerId");

-- CreateIndex
CREATE INDEX "ContentHistory_customerId_idx" ON "ContentHistory"("customerId");

-- CreateIndex
CREATE INDEX "ContentHistory_platform_idx" ON "ContentHistory"("platform");

-- CreateIndex
CREATE INDEX "ContentHistory_contentType_idx" ON "ContentHistory"("contentType");

-- CreateIndex
CREATE INDEX "ContentHistory_status_idx" ON "ContentHistory"("status");

-- CreateIndex
CREATE INDEX "ContentHistory_publishedAt_idx" ON "ContentHistory"("publishedAt");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishHabit" ADD CONSTRAINT "PublishHabit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPreference" ADD CONSTRAINT "ContentPreference_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingStyle" ADD CONSTRAINT "WritingStyle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendTracking" ADD CONSTRAINT "TrendTracking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentHistory" ADD CONSTRAINT "ContentHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

