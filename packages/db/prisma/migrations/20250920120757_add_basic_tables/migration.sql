-- DropForeignKey
ALTER TABLE "public"."Novel" DROP CONSTRAINT "Novel_imageId_fkey";

-- AlterTable
ALTER TABLE "public"."Novel" ALTER COLUMN "imageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Novel" ADD CONSTRAINT "Novel_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
