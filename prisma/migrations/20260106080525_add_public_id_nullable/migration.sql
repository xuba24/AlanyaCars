/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `ListingImage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."ListingImage" ADD COLUMN     "publicId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ListingImage_publicId_key" ON "public"."ListingImage"("publicId");
