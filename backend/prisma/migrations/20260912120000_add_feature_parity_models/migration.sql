-- AlterEnum
ALTER TYPE "ReminderRepeat" ADD VALUE IF NOT EXISTS 'WEEKDAYS';

-- CreateEnum
CREATE TYPE "ReminderPriority" AS ENUM ('NORMAL', 'IMPORTANT');

-- CreateEnum
CREATE TYPE "MemoryStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "PortraitTone" AS ENUM ('AMBER', 'SAGE', 'LILAC', 'CLAY', 'DUSK');

-- AlterTable: User
ALTER TABLE "users" ADD COLUMN "pin" TEXT,
ADD COLUMN "layer" INTEGER,
ADD COLUMN "portraitTone" "PortraitTone",
ADD COLUMN "callsPatient" TEXT,
ADD COLUMN "canSeeTrends" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "visibleMemoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Patient
ALTER TABLE "patients" ADD COLUMN "displayName" TEXT,
ADD COLUMN "region" TEXT,
ADD COLUMN "portraitTone" "PortraitTone",
ADD COLUMN "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "speechRate" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
ADD COLUMN "morningRoutine" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: Reminder
ALTER TABLE "reminders" ADD COLUMN "time" TEXT NOT NULL DEFAULT '',
ADD COLUMN "priority" "ReminderPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "note" TEXT,
ADD COLUMN "assignedToUserId" UUID;

-- CreateTable: Person
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "photoUrl" TEXT,
    "portraitTone" "PortraitTone" NOT NULL DEFAULT 'SAGE',
    "isPatient" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "people_patientId_idx" ON "people"("patientId");

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Memory
CREATE TABLE "memories" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "personId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdByUserId" UUID NOT NULL,
    "status" "MemoryStatus" NOT NULL DEFAULT 'PENDING',
    "usableInActivities" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "memories_patientId_idx" ON "memories"("patientId");

-- CreateIndex
CREATE INDEX "memories_status_idx" ON "memories"("status");

-- CreateIndex
CREATE INDEX "memories_createdByUserId_idx" ON "memories"("createdByUserId");

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memories" ADD CONSTRAINT "memories_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON UPDATE CASCADE;

-- CreateTable: VoiceNote
CREATE TABLE "voice_notes" (
    "id" UUID NOT NULL,
    "personId" UUID,
    "memoryId" UUID,
    "audioUrl" TEXT,
    "transcript" TEXT,
    "seconds" INTEGER NOT NULL,
    "recordedBy" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voice_notes_personId_idx" ON "voice_notes"("personId");

-- CreateIndex
CREATE INDEX "voice_notes_memoryId_idx" ON "voice_notes"("memoryId");

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_notes" ADD CONSTRAINT "voice_notes_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: MoodEntry
CREATE TABLE "mood_entries" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mood" TEXT NOT NULL,
    "note" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mood_entries_patientId_idx" ON "mood_entries"("patientId");

-- CreateIndex
CREATE INDEX "mood_entries_userId_idx" ON "mood_entries"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_date_idx" ON "mood_entries"("date");

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE CASCADE;

-- CreateTable: Invite
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "layer" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invites_patientId_idx" ON "invites"("patientId");

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
