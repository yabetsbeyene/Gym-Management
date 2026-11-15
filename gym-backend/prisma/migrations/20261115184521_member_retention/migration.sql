-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "autoDeleteExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deletedAt" TIMESTAMP(3);
