-- Add isPublic flag to courses
ALTER TABLE "Course"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
