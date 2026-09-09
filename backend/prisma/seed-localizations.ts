import { PrismaClient } from "@prisma/client";
import { upsertLocalizations } from "./localizations";

const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({ select: { id: true, slug: true } });
  await upsertLocalizations(prisma, new Map(games.map(g => [g.slug, g])));
  const count = await prisma.gameLocalization.count();
  console.log(`Game localizations in DB: ${count}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());