import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding 7 demo users...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const demoUsers = [
    { name: "Mala Borthakur", phone: "9000000101", email: "demo1@test.com", role: "FAMILY_CAREGIVER" as const },
    { name: "Rajib Bora", phone: "9000000102", email: "demo2@test.com", role: "FAMILY_CAREGIVER" as const },
    { name: "Arun Sharma", phone: "9000000103", email: "demo3@test.com", role: "CONNECTED_FAMILY" as const },
    { name: "Deepa Das", phone: "9000000104", email: "demo4@test.com", role: "CONNECTED_FAMILY" as const },
    { name: "Nabin Kalita", phone: "9000000105", email: "demo5@test.com", role: "CONNECTED_FAMILY" as const },
    { name: "Anima Deka", phone: "9000000106", email: "demo6@test.com", role: "HEALTH_WORKER" as const },
    { name: "Nirmal Gogoi", phone: "9000000107", email: "demo7@test.com", role: "ADMIN" as const },
  ];

  const result = await prisma.user.createMany({
    data: demoUsers.map((u) => ({ ...u, passwordHash })),
    skipDuplicates: true,
  });

  console.log(`Users created: ${result.count}`);

  const anima = await prisma.user.findUnique({
    where: { email: "demo6@test.com" },
  });

  if (anima && anima.role === "HEALTH_WORKER") {
    const existing = await prisma.healthWorker.findUnique({
      where: { userId: anima.id },
    });
    if (!existing) {
      await prisma.healthWorker.create({
        data: {
          userId: anima.id,
          area: "Barpeta",
          workerType: "ANM",
          phone: "9000000106",
        },
      });
      console.log("HealthWorker record created for Anima Deka (ANM, Barpeta)");
    } else {
      console.log("HealthWorker record already exists for Anima Deka");
    }
  }

  console.log("\nDone! 7 demo users added successfully.");
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });