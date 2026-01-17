-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROF', 'STUDENT');

-- CreateEnum
CREATE TYPE "IntivationStatus" AS ENUM ('EXPIRED', 'GOOD', 'ACCEPTED');

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "validThrough" TIMESTAMP(3) NOT NULL,
    "status" "IntivationStatus" NOT NULL DEFAULT 'GOOD',

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_key" ON "Invitation"("email");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
