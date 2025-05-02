-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- AlterTable
ALTER TABLE "Journal" ADD COLUMN     "reviewDate" TIMESTAMP(3),
ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "reviewerId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "academicDegrees" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "citationsCount" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "googleScholarId" TEXT,
ADD COLUMN     "hIndex" INTEGER,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "orcidId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "profileStatus" "ProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN     "publicationsCount" INTEGER,
ADD COLUMN     "researchGateUrl" TEXT,
ADD COLUMN     "researchInterests" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "twitterHandle" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "Journal_reviewerId_idx" ON "Journal"("reviewerId");

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
