/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImageTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `matchedImage` on the `Content` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Image";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ImageTag";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tag";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "cleanedText" TEXT,
    "coverData" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Content_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Content" ("cleanedText", "coverData", "createdAt", "customerId", "id", "originalText", "productName", "productSlogan", "status", "subtitle", "title", "updatedAt") SELECT "cleanedText", "coverData", "createdAt", "customerId", "id", "originalText", "productName", "productSlogan", "status", "subtitle", "title", "updatedAt" FROM "Content";
DROP TABLE "Content";
ALTER TABLE "new_Content" RENAME TO "Content";
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Customer" ("age", "createdAt", "gender", "id", "name", "needs", "nickname", "occupation", "painPoints", "scenes", "status", "updatedAt") SELECT "age", "createdAt", "gender", "id", "name", "needs", "nickname", "occupation", "painPoints", "scenes", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_key_key" ON "Prompt"("key");
