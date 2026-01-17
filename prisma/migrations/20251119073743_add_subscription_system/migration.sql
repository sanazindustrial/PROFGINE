-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('FREE_TRIAL', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'FREE_TRIAL',
ADD COLUMN     "trialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "trialStartedAt" TIMESTAMP(3);
