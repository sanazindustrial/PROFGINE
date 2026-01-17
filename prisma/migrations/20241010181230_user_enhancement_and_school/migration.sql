/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `university` on the `User` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastLoginDate` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modifiedBy` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STUDENT';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "university",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastLoginDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "modifiedBy" INTEGER NOT NULL,
ADD COLUMN     "modifiedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SchoolToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SchoolToUser_AB_unique" ON "_SchoolToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_SchoolToUser_B_index" ON "_SchoolToUser"("B");

-- AddForeignKey
ALTER TABLE "_SchoolToUser" ADD CONSTRAINT "_SchoolToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SchoolToUser" ADD CONSTRAINT "_SchoolToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
