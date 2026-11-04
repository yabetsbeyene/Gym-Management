-- CreateTable
CREATE TABLE "AccessAttempt" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "duplicate" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "memberId" TEXT,
    "dayPassId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessAttempt_createdAt_idx" ON "AccessAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "AccessAttempt_allowed_createdAt_idx" ON "AccessAttempt"("allowed", "createdAt");

-- AddForeignKey
ALTER TABLE "AccessAttempt" ADD CONSTRAINT "AccessAttempt_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAttempt" ADD CONSTRAINT "AccessAttempt_dayPassId_fkey" FOREIGN KEY ("dayPassId") REFERENCES "DayPass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessAttempt" ADD CONSTRAINT "AccessAttempt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
