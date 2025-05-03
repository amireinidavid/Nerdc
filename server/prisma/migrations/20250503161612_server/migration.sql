-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_journalId_fkey";

-- DropForeignKey
ALTER TABLE "Download" DROP CONSTRAINT "Download_journalId_fkey";

-- DropForeignKey
ALTER TABLE "SavedJournal" DROP CONSTRAINT "SavedJournal_journalId_fkey";

-- DropForeignKey
ALTER TABLE "TagsOnJournals" DROP CONSTRAINT "TagsOnJournals_journalId_fkey";

-- AddForeignKey
ALTER TABLE "TagsOnJournals" ADD CONSTRAINT "TagsOnJournals_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedJournal" ADD CONSTRAINT "SavedJournal_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
