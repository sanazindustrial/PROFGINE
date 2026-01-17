/*
  Warnings:

  - You are about to drop the `School` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_SchoolToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_SchoolToUser" DROP CONSTRAINT "_SchoolToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_SchoolToUser" DROP CONSTRAINT "_SchoolToUser_B_fkey";

-- DropTable
DROP TABLE "School";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "_SchoolToUser";

-- DropEnum
DROP TYPE "Role";
