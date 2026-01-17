/*
  Warnings:

  - The values [CANCELLED,TRIAL,EXPIRED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `registeredAt` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE_TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TABLE "OrgSubscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TABLE "UserSubscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'TRIALING';
COMMIT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "content" TEXT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'TRIALING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "registeredAt",
ADD COLUMN     "password" TEXT,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "trialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgRole" "OrgRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgSubscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgUsageCounter" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentsCount" INTEGER NOT NULL DEFAULT 0,
    "coursesCount" INTEGER NOT NULL DEFAULT 0,
    "assignmentsCount" INTEGER NOT NULL DEFAULT 0,
    "aiGradesCount" INTEGER NOT NULL DEFAULT 0,
    "plagiarismScansCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrgUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE_TRIAL',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coursesCount" INTEGER NOT NULL DEFAULT 0,
    "assignmentsCount" INTEGER NOT NULL DEFAULT 0,
    "aiGradesCount" INTEGER NOT NULL DEFAULT 0,
    "plagiarismScansCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserUsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgSubscription_orgId_key" ON "OrgSubscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgUsageCounter_orgId_key" ON "OrgUsageCounter"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserUsageCounter_userId_key" ON "UserUsageCounter"("userId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgSubscription" ADD CONSTRAINT "OrgSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgUsageCounter" ADD CONSTRAINT "OrgUsageCounter_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserUsageCounter" ADD CONSTRAINT "UserUsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
