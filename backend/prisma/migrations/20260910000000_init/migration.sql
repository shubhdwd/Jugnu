-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FAMILY_CAREGIVER', 'CONNECTED_FAMILY', 'HEALTH_WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('DATA_COLLECTION', 'GAME_PLAY', 'PHOTO_USAGE', 'VOICE_RECORDING', 'FAMILY_SHARING', 'HEALTH_WORKER_ACCESS');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('OBJECT_MATCH', 'ROUTINE_SEQUENCING', 'PATTERN_RECALL', 'WHO_IS_CALLING', 'REMEMBER_WHEN', 'MY_DAILY_ROUTINE');

-- CreateEnum
CREATE TYPE "GameCategory" AS ENUM ('OBJECT_RECOGNITION', 'SEQUENCING', 'PATTERN_RECALL', 'REMINISCENCE', 'PERSONALIZED_ROUTINE');

-- CreateEnum
CREATE TYPE "GameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'ABANDONED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "PersonalizationLevel" AS ENUM ('GENERIC', 'FULL');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('MEDICATION', 'HYDRATION', 'ACTIVITY', 'APPOINTMENT');

-- CreateEnum
CREATE TYPE "ReminderRepeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SUGGESTED_CLINICAL_REVIEW', 'CAREGIVER_SUPPORT');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('PRIMARY', 'VIEW_ONLY');

-- CreateEnum
CREATE TYPE "HealthWorkerType" AS ENUM ('ANM', 'ASHA', 'CHO', 'DOCTOR');

-- CreateEnum
CREATE TYPE "SyncEventType" AS ENUM ('GAME_ATTEMPT', 'SESSION_START', 'SESSION_END', 'MOOD_CHECKIN', 'REMINDER_DISMISSED', 'PERSONALIZATION_UPDATE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "CaregiverMood" AS ENUM ('HAPPY', 'NEUTRAL', 'SAD');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "refreshTokens" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'assamese',
    "village" TEXT,
    "location" TEXT,
    "roomWard" TEXT,
    "caregiverId" UUID NOT NULL,
    "profilePhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedBy" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "GameType" NOT NULL,
    "category" "GameCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "personalizationLevel" "PersonalizationLevel" NOT NULL DEFAULT 'GENERIC',
    "language" TEXT NOT NULL DEFAULT 'assamese',
    "imageUrl" TEXT,
    "contentUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "difficultyMin" "GameDifficulty" NOT NULL DEFAULT 'EASY',
    "difficultyMax" "GameDifficulty" NOT NULL DEFAULT 'HARD',
    "targetSuccessMin" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "targetSuccessMax" DOUBLE PRECISION NOT NULL DEFAULT 0.80,
    "configuration" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "completionStatus" "CompletionStatus",
    "offlineCreated" BOOLEAN NOT NULL DEFAULT false,
    "offlineEventId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempts" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "questionId" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "responseTimeMs" INTEGER,
    "difficulty" "GameDifficulty" NOT NULL,
    "score" DOUBLE PRECISION,
    "selectedAnswer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offlineEventId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalizations" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "level" "PersonalizationLevel" NOT NULL DEFAULT 'GENERIC',
    "photosMetadata" JSONB,
    "voiceMetadata" JSONB,
    "preferences" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_assets" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "contentType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileUrl" TEXT,
    "transcript" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "repeatRule" "ReminderRepeat" NOT NULL DEFAULT 'NONE',
    "customRepeatRule" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caregiver_mood_checkins" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "mood" "CaregiverMood" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caregiver_mood_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "cognitiveDomain" TEXT NOT NULL,
    "abilityEstimate" DOUBLE PRECISION NOT NULL,
    "baselineValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "trend" "TrendDirection",
    "explanation" TEXT NOT NULL,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "relationship" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'VIEW_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_workers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "area" TEXT NOT NULL,
    "workerType" "HealthWorkerType" NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_events" (
    "id" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventType" "SyncEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_packs" (
    "id" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "packKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "patients_caregiverId_idx" ON "patients"("caregiverId");

-- CreateIndex
CREATE INDEX "patients_village_idx" ON "patients"("village");

-- CreateIndex
CREATE UNIQUE INDEX "consents_patientId_consentType_key" ON "consents"("patientId", "consentType");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX "games_type_idx" ON "games"("type");

-- CreateIndex
CREATE INDEX "games_category_idx" ON "games"("category");

-- CreateIndex
CREATE INDEX "games_personalizationLevel_idx" ON "games"("personalizationLevel");

-- CreateIndex
CREATE INDEX "games_language_idx" ON "games"("language");

-- CreateIndex
CREATE INDEX "games_active_idx" ON "games"("active");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_offlineEventId_key" ON "sessions"("offlineEventId");

-- CreateIndex
CREATE INDEX "sessions_patientId_idx" ON "sessions"("patientId");

-- CreateIndex
CREATE INDEX "sessions_gameId_idx" ON "sessions"("gameId");

-- CreateIndex
CREATE INDEX "sessions_startedAt_idx" ON "sessions"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "attempts_offlineEventId_key" ON "attempts"("offlineEventId");

-- CreateIndex
CREATE INDEX "attempts_sessionId_idx" ON "attempts"("sessionId");

-- CreateIndex
CREATE INDEX "attempts_timestamp_idx" ON "attempts"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "personalizations_patientId_key" ON "personalizations"("patientId");

-- CreateIndex
CREATE INDEX "game_assets_patientId_idx" ON "game_assets"("patientId");

-- CreateIndex
CREATE INDEX "game_assets_gameId_idx" ON "game_assets"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "game_assets_patientId_gameId_label_key" ON "game_assets"("patientId", "gameId", "label");

-- CreateIndex
CREATE INDEX "reminders_patientId_idx" ON "reminders"("patientId");

-- CreateIndex
CREATE INDEX "reminders_active_idx" ON "reminders"("active");

-- CreateIndex
CREATE INDEX "reminders_scheduledAt_idx" ON "reminders"("scheduledAt");

-- CreateIndex
CREATE INDEX "caregiver_mood_checkins_patientId_idx" ON "caregiver_mood_checkins"("patientId");

-- CreateIndex
CREATE INDEX "caregiver_mood_checkins_createdAt_idx" ON "caregiver_mood_checkins"("createdAt");

-- CreateIndex
CREATE INDEX "insights_patientId_idx" ON "insights"("patientId");

-- CreateIndex
CREATE INDEX "insights_cognitiveDomain_idx" ON "insights"("cognitiveDomain");

-- CreateIndex
CREATE INDEX "insights_createdAt_idx" ON "insights"("createdAt");

-- CreateIndex
CREATE INDEX "alerts_patientId_idx" ON "alerts"("patientId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_patientId_userId_key" ON "family_members"("patientId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "health_workers_userId_key" ON "health_workers"("userId");

-- CreateIndex
CREATE INDEX "health_workers_area_idx" ON "health_workers"("area");

-- CreateIndex
CREATE UNIQUE INDEX "sync_events_eventId_key" ON "sync_events"("eventId");

-- CreateIndex
CREATE INDEX "sync_events_eventId_idx" ON "sync_events"("eventId");

-- CreateIndex
CREATE INDEX "sync_events_deviceId_idx" ON "sync_events"("deviceId");

-- CreateIndex
CREATE INDEX "sync_events_status_idx" ON "sync_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "resource_packs_language_packKey_key" ON "resource_packs"("language", "packKey");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consents" ADD CONSTRAINT "consents_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalizations" ADD CONSTRAINT "personalizations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_assets" ADD CONSTRAINT "game_assets_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_assets" ADD CONSTRAINT "game_assets_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caregiver_mood_checkins" ADD CONSTRAINT "caregiver_mood_checkins_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_workers" ADD CONSTRAINT "health_workers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

