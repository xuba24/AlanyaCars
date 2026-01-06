-- CreateEnum
CREATE TYPE "public"."RegistrationType" AS ENUM ('NOT_CLEARED', 'RF', 'RSO');

-- AlterTable
ALTER TABLE "public"."Listing" ADD COLUMN     "registration" "public"."RegistrationType";

-- AlterTable
ALTER TABLE "public"."PromotionPlan" ALTER COLUMN "currency" SET DEFAULT 'RUB';
