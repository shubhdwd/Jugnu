-- CreateTable
CREATE TABLE "game_localizations" (
    "id" UUID NOT NULL,
    "gameId" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" JSONB,
    "audioPackUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_localizations_language_idx" ON "game_localizations"("language");

-- CreateIndex
CREATE INDEX "game_localizations_active_idx" ON "game_localizations"("active");

-- CreateIndex
CREATE UNIQUE INDEX "game_localizations_gameId_language_key" ON "game_localizations"("gameId", "language");

-- AddForeignKey
ALTER TABLE "game_localizations" ADD CONSTRAINT "game_localizations_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

