-- CreateEnum
CREATE TYPE "PresentationSource" AS ENUM ('TEXTBOOK', 'LECTURE_NOTES', 'RESEARCH_PAPER', 'WEB_CONTENT', 'MIXED');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('DRAFT', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPORTED');

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceType" "PresentationSource" NOT NULL DEFAULT 'MIXED',
    "templateStyle" TEXT NOT NULL DEFAULT 'modern-minimalist',
    "slideCount" INTEGER NOT NULL DEFAULT 0,
    "targetDuration" INTEGER,
    "status" "PresentationStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "pdfUrl" TEXT,
    "previewUrl" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationSlide" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "slideNumber" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "notes" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'title-content',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresentationSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresentationSourceFile" (
    "id" TEXT NOT NULL,
    "presentationId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "pages" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresentationSourceFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PresentationSlide_presentationId_slideNumber_key" ON "PresentationSlide"("presentationId", "slideNumber");

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationSlide" ADD CONSTRAINT "PresentationSlide_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresentationSourceFile" ADD CONSTRAINT "PresentationSourceFile_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
