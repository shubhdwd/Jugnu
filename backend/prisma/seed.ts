import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { upsertLocalizations } from "./localizations";

const prisma = new PrismaClient();

function uid(): string {
  return uuidv4();
}

async function main() {
  console.log("Seeding database...");

  // ─── Users ────────────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("admin123", 10);
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      id: uid(),
      name: "Jugnu Admin",
      phone: "9000000000",
      email: "admin@jugnu.org",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const caregiver1 = await prisma.user.create({
    data: {
      id: uid(),
      name: "Anita Sharma",
      phone: "9000000001",
      email: "caregiver1@test.com",
      passwordHash,
      role: "FAMILY_CAREGIVER",
    },
  });

  const caregiver2 = await prisma.user.create({
    data: {
      id: uid(),
      name: "Ramesh Das",
      phone: "9000000002",
      email: "caregiver2@test.com",
      passwordHash,
      role: "FAMILY_CAREGIVER",
    },
  });

  const familyMember = await prisma.user.create({
    data: {
      id: uid(),
      name: "Priya Sharma",
      phone: "9000000003",
      email: "family1@test.com",
      passwordHash,
      role: "CONNECTED_FAMILY",
    },
  });

  const healthWorkerUser = await prisma.user.create({
    data: {
      id: uid(),
      name: "Dr. Bipin Kalita",
      phone: "9000000004",
      email: "healthworker@test.com",
      passwordHash,
      role: "HEALTH_WORKER",
    },
  });

  console.log("Users created");

  // ─── Health Worker ────────────────────────────────────────────────────────────

  await prisma.healthWorker.create({
    data: {
      id: uid(),
      userId: healthWorkerUser.id,
      area: "Hajo",
      workerType: "ASHA",
      phone: "9000000004",
    },
  });

  // ─── Patients ─────────────────────────────────────────────────────────────────

  const patient1 = await prisma.patient.create({
    data: {
      id: uid(),
      name: "Lakshmi Devi",
      age: 72,
      gender: "FEMALE",
      language: "assamese",
      village: "Hajo",
      location: "Kamrup, Assam",
      roomWard: "Room 12",
      caregiverId: caregiver1.id,
      profilePhotoUrl: null,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      id: uid(),
      name: "Gopal Chandra Bora",
      age: 68,
      gender: "MALE",
      language: "assamese",
      village: "Sualkuchi",
      location: "Kamrup, Assam",
      roomWard: "Room 5",
      caregiverId: caregiver1.id,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      id: uid(),
      name: "Sunita Devi",
      age: 80,
      gender: "FEMALE",
      language: "bengali",
      village: "Barpeta",
      location: "Barpeta, Assam",
      roomWard: "Ward 3",
      caregiverId: caregiver2.id,
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      id: uid(),
      name: "Ibodhom Singh",
      age: 55,
      gender: "MALE",
      language: "meitei",
      village: "Imphal East",
      location: "Imphal, Manipur",
      roomWard: "Room 8",
      caregiverId: caregiver2.id,
    },
  });

  console.log("Patients created");

  // ─── Consents ─────────────────────────────────────────────────────────────────

  const consentTypes = [
    "DATA_COLLECTION",
    "GAME_PLAY",
    "PHOTO_USAGE",
    "VOICE_RECORDING",
    "FAMILY_SHARING",
    "HEALTH_WORKER_ACCESS",
  ] as const;

  for (const patient of [patient1, patient2, patient3, patient4]) {
    for (const ct of consentTypes) {
      await prisma.consent.create({
        data: {
          id: uid(),
          patientId: patient.id,
          consentType: ct,
          granted: true,
          grantedBy: caregiver1.id,
          note: `Consent granted for ${ct.toLowerCase().replace(/_/g, " ")}`,
        },
      });
    }
  }

  console.log("Consents created");

  // ─── Personalizations ─────────────────────────────────────────────────────────

  await prisma.personalization.create({
    data: {
      id: uid(),
      patientId: patient1.id,
      level: "FULL",
      voiceMetadata: { voiceCount: 3, languages: ["assamese"] },
      photosMetadata: { photoCount: 5, albums: ["family", "daily"] },
      preferences: { preferredDifficulty: "MEDIUM", soundEnabled: true },
    },
  });

  await prisma.personalization.create({
    data: {
      id: uid(),
      patientId: patient2.id,
      level: "FULL",
      voiceMetadata: { voiceCount: 2, languages: ["assamese"] },
      preferences: { preferredDifficulty: "EASY", soundEnabled: true },
    },
  });

  await prisma.personalization.create({
    data: {
      id: uid(),
      patientId: patient3.id,
      level: "GENERIC",
      preferences: { preferredDifficulty: "EASY", soundEnabled: true },
    },
  });

  console.log("Personalizations created");

  // ─── Games ────────────────────────────────────────────────────────────────────

  const objectMatch = await prisma.game.create({
    data: {
      id: uid(),
      name: "Object Match",
      slug: "object-match",
      type: "OBJECT_MATCH",
      category: "OBJECT_RECOGNITION",
      description:
        "Match identical objects or identify familiar household items. Tests pattern recognition and visual memory using culturally familiar objects like kettles, baskets, fruits, and everyday items.",
      personalizationLevel: "GENERIC",
      language: "assamese",
      imageUrl: "/images/games/object-match.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        maxPairs: 6,
        timeLimitSeconds: 120,
        objectSets: [
          {
            name: "kitchen",
            items: ["kettle", "plate", "glass", "spoon", "bowl", "cup"],
          },
          {
            name: "garden",
            items: ["basket", "pot", "bucket", "broom", "stool", "mat"],
          },
          {
            name: "fruits",
            items: ["mango", "banana", "guava", "orange", "apple", "papaya"],
          },
        ],
        roundsPerSession: 10,
        displayTimeMs: 3000,
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  const routineSequencing = await prisma.game.create({
    data: {
      id: uid(),
      name: "Routine Sequencing",
      slug: "routine-sequencing",
      type: "ROUTINE_SEQUENCING",
      category: "SEQUENCING",
      description:
        "Arrange steps of common daily activities in the correct order. Tests cognitive sequencing and daily-task understanding. Activities include making tea, bathing, cooking rice, and other familiar routines.",
      personalizationLevel: "GENERIC",
      language: "assamese",
      imageUrl: "/images/games/routine-sequencing.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        routines: [
          {
            name: "making_tea",
            steps: [
              "Boil water",
              "Add tea leaves",
              "Add milk",
              "Add sugar",
              "Strain and pour",
            ],
          },
          {
            name: "bathing",
            steps: [
              "Fill bucket with water",
              "Take soap",
              "Apply soap on body",
              "Rinse with water",
              "Dry with towel",
            ],
          },
          {
            name: "cooking_rice",
            steps: [
              "Wash rice",
              "Add water to pot",
              "Put rice in pot",
              "Cover and cook",
              "Strain excess water",
            ],
          },
          {
            name: "morning_routine",
            steps: [
              "Wake up",
              "Brush teeth",
              "Take bath",
              "Get dressed",
              "Have breakfast",
            ],
          },
        ],
        maxStepsPerRound: 6,
        allowVisualHints: true,
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  const patternRecall = await prisma.game.create({
    data: {
      id: uid(),
      name: "Pattern Recall",
      slug: "pattern-recall",
      type: "PATTERN_RECALL",
      category: "PATTERN_RECALL",
      description:
        "Watch or listen to a short sequence of shapes, colors, or sounds, then recall and repeat the sequence. Tests attention and short-term memory recall.",
      personalizationLevel: "GENERIC",
      language: "assamese",
      imageUrl: "/images/games/pattern-recall.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        sequenceTypes: ["color", "shape", "sound"],
        minSequenceLength: 3,
        maxSequenceLength: 7,
        displayIntervalMs: 1500,
        recallTimeoutMs: 10000,
        colorOptions: ["red", "blue", "green", "yellow", "orange", "purple"],
        shapeOptions: ["circle", "square", "triangle", "star", "diamond", "heart"],
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  const whosCalling = await prisma.game.create({
    data: {
      id: uid(),
      name: "Who Is Calling?",
      slug: "whos-calling",
      type: "WHO_IS_CALLING",
      category: "REMINISCENCE",
      description:
        "Listen to a voice recording of a family member and identify who is speaking. Uses caregiver-recorded voice clips for personalized recognition and reminiscence. Personalized level uses audio and optional photos.",
      personalizationLevel: "FULL",
      language: "assamese",
      imageUrl: "/images/games/whos-calling.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        numberOfOptions: 4,
        playCountPerClip: 2,
        timeBetweenOptionsMs: 2000,
        usePhotos: false,
        requireVoiceAssets: true,
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  const rememberWhen = await prisma.game.create({
    data: {
      id: uid(),
      name: "Remember When",
      slug: "remember-when",
      type: "REMEMBER_WHEN",
      category: "REMINISCENCE",
      description:
        "Listen to a short personal memory or anecdote recorded by a caregiver, then answer a simple related question. Encourages reminiscence and personal memory engagement.",
      personalizationLevel: "FULL",
      language: "assamese",
      imageUrl: "/images/games/remember-when.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        maxQuestionOptions: 4,
        allowAudioReplay: true,
        replayCount: 2,
        questionTypes: ["where", "who", "what", "when"],
        requireVoiceAssets: true,
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  const myDailyRoutine = await prisma.game.create({
    data: {
      id: uid(),
      name: "My Daily Routine",
      slug: "my-daily-routine",
      type: "MY_DAILY_ROUTINE",
      category: "PERSONALIZED_ROUTINE",
      description:
        "Arrange your own personal daily routine steps in the correct order. Uses caregiver-provided voice recordings and optional photos to create a personalized sequencing activity based on the patient's actual routine.",
      personalizationLevel: "FULL",
      language: "assamese",
      imageUrl: "/images/games/my-daily-routine.png",
      active: true,
      difficultyMin: "EASY",
      difficultyMax: "HARD",
      targetSuccessMin: 0.70,
      targetSuccessMax: 0.80,
      configuration: {
        maxSteps: 8,
        allowVoiceNarration: true,
        allowPhotos: true,
        requireVoiceAssets: true,
        routineCategories: ["morning", "afternoon", "evening", "medication"],
      },
      metadata: { version: "1.0", author: "Jugnu Team" },
    },
  });

  console.log("Games created");

  // ─── Game Localizations (expandable language packs) ───────────────────────────

  const gamesBySlug = new Map(
    [objectMatch, routineSequencing, patternRecall, whosCalling, rememberWhen, myDailyRoutine].map(g => [g.slug, g]),
  );

  await upsertLocalizations(prisma, gamesBySlug);

  console.log("Game localizations created");

  // ─── Game Assets (for personalized games) ────────────────────────────────────

  await prisma.gameAsset.createMany({
    data: [
      {
        id: uid(),
        patientId: patient1.id,
        gameId: whosCalling.id,
        contentType: "voice",
        label: "father_voice",
        fileUrl: "/assets/voice/patient1_father.mp3",
        transcript: "Beta, main hoon tumhare papa.",
        metadata: { speaker: "Father", durationMs: 3500 },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: whosCalling.id,
        contentType: "voice",
        label: "daughter_voice",
        fileUrl: "/assets/voice/patient1_daughter.mp3",
        transcript: "Mummy, main Priya bol rahi hoon.",
        metadata: { speaker: "Daughter Priya", durationMs: 3000 },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: whosCalling.id,
        contentType: "photo",
        label: "father_photo",
        fileUrl: "/assets/photos/patient1_father.jpg",
        metadata: { description: "Father's portrait" },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: whosCalling.id,
        contentType: "photo",
        label: "daughter_photo",
        fileUrl: "/assets/photos/patient1_daughter.jpg",
        metadata: { description: "Daughter Priya's photo" },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: rememberWhen.id,
        contentType: "voice",
        label: "picnic_memory",
        fileUrl: "/assets/voice/patient1_picnic.mp3",
        transcript: "Do you remember the family picnic near the river last summer? We all had such a wonderful time.",
        metadata: { memoryType: "picnic", participants: ["family"] },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: rememberWhen.id,
        contentType: "voice",
        label: "wedding_memory",
        fileUrl: "/assets/voice/patient1_wedding.mp3",
        transcript: "Remember Priya's wedding? The whole village came to celebrate.",
        metadata: { memoryType: "wedding", participants: ["family", "village"] },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: myDailyRoutine.id,
        contentType: "routine_step",
        label: "morning_wake_up",
        fileUrl: "/assets/voice/patient1_morning.mp3",
        transcript: "Wake up at 6 AM, brush teeth, take morning tea",
        metadata: { timeOfDay: "morning", stepOrder: 1 },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: myDailyRoutine.id,
        contentType: "routine_step",
        label: "morning_prayer",
        fileUrl: "/assets/voice/patient1_prayer.mp3",
        transcript: "Morning prayer at the temple",
        metadata: { timeOfDay: "morning", stepOrder: 2 },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: myDailyRoutine.id,
        contentType: "photo",
        label: "morning_prayer_photo",
        fileUrl: "/assets/photos/patient1_prayer.jpg",
        metadata: { description: "Temple near home" },
      },
      {
        id: uid(),
        patientId: patient1.id,
        gameId: myDailyRoutine.id,
        contentType: "routine_step",
        label: "afternoon_medication",
        fileUrl: "/assets/voice/patient1_medication.mp3",
        transcript: "Take afternoon medication at 2 PM",
        metadata: { timeOfDay: "afternoon", stepOrder: 3 },
      },
      {
        id: uid(),
        patientId: patient2.id,
        gameId: whosCalling.id,
        contentType: "voice",
        label: "son_voice",
        fileUrl: "/assets/voice/patient2_son.mp3",
        transcript: "Papa, main Anil bol raha hoon.",
        metadata: { speaker: "Son Anil", durationMs: 2800 },
      },
      {
        id: uid(),
        patientId: patient2.id,
        gameId: whosCalling.id,
        contentType: "voice",
        label: "wife_voice",
        fileUrl: "/assets/voice/patient2_wife.mp3",
        transcript: "Gopal ji, main Kamala hoon.",
        metadata: { speaker: "Wife Kamala", durationMs: 2500 },
      },
      {
        id: uid(),
        patientId: patient2.id,
        gameId: rememberWhen.id,
        contentType: "voice",
        label: "village_festival",
        fileUrl: "/assets/voice/patient2_festival.mp3",
        transcript: "Do you remember the Bihu festival in our village? We danced all night.",
        metadata: { memoryType: "festival", participants: ["village"] },
      },
    ],
  });

  console.log("Game assets created");

  // ─── Family Members ───────────────────────────────────────────────────────────

  await prisma.familyMember.create({
    data: {
      id: uid(),
      patientId: patient1.id,
      userId: familyMember.id,
      relationship: "Daughter",
      accessLevel: "VIEW_ONLY",
    },
  });

  console.log("Family members created");

  // ─── Sessions ─────────────────────────────────────────────────────────────────

  const now = new Date();
  const sessionData: Array<{
    patientId: string;
    gameId: string;
    startedAt: Date;
    endedAt: Date | null;
    completionStatus: "COMPLETED" | "PARTIAL" | "ABANDONED" | "TIMEOUT";
    offlineCreated: boolean;
  }> = [
    { patientId: patient1.id, gameId: objectMatch.id, startedAt: new Date(now.getTime() - 86400000 * 7), endedAt: new Date(now.getTime() - 86400000 * 7 + 900000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient1.id, gameId: routineSequencing.id, startedAt: new Date(now.getTime() - 86400000 * 6), endedAt: new Date(now.getTime() - 86400000 * 6 + 600000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient1.id, gameId: patternRecall.id, startedAt: new Date(now.getTime() - 86400000 * 5), endedAt: new Date(now.getTime() - 86400000 * 5 + 450000), completionStatus: "PARTIAL", offlineCreated: false },
    { patientId: patient1.id, gameId: objectMatch.id, startedAt: new Date(now.getTime() - 86400000 * 4), endedAt: new Date(now.getTime() - 86400000 * 4 + 780000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient1.id, gameId: whosCalling.id, startedAt: new Date(now.getTime() - 86400000 * 3), endedAt: new Date(now.getTime() - 86400000 * 3 + 540000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient1.id, gameId: rememberWhen.id, startedAt: new Date(now.getTime() - 86400000 * 2), endedAt: new Date(now.getTime() - 86400000 * 2 + 420000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient1.id, gameId: myDailyRoutine.id, startedAt: new Date(now.getTime() - 86400000), endedAt: new Date(now.getTime() - 86400000 + 600000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient2.id, gameId: routineSequencing.id, startedAt: new Date(now.getTime() - 86400000 * 7), endedAt: new Date(now.getTime() - 86400000 * 7 + 540000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient2.id, gameId: objectMatch.id, startedAt: new Date(now.getTime() - 86400000 * 5), endedAt: new Date(now.getTime() - 86400000 * 5 + 1200000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient2.id, gameId: whosCalling.id, startedAt: new Date(now.getTime() - 86400000 * 3), endedAt: new Date(now.getTime() - 86400000 * 3 + 300000), completionStatus: "TIMEOUT", offlineCreated: false },
    { patientId: patient2.id, gameId: rememberWhen.id, startedAt: new Date(now.getTime() - 86400000 * 2), endedAt: new Date(now.getTime() - 86400000 * 2 + 900000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient3.id, gameId: patternRecall.id, startedAt: new Date(now.getTime() - 86400000 * 6), endedAt: new Date(now.getTime() - 86400000 * 6 + 700000), completionStatus: "COMPLETED", offlineCreated: false },
    { patientId: patient3.id, gameId: objectMatch.id, startedAt: new Date(now.getTime() - 86400000 * 3), endedAt: new Date(now.getTime() - 86400000 * 3 + 480000), completionStatus: "COMPLETED", offlineCreated: false },
  ];

  const sessions: Array<{ id: string; patientId: string; gameId: string }> = [];

  for (const s of sessionData) {
    const session = await prisma.session.create({
      data: {
        id: uid(),
        ...s,
      },
    });
    sessions.push(session);
  }

  console.log("Sessions created");

  // ─── Attempts ─────────────────────────────────────────────────────────────────

  const difficulties = ["EASY", "MEDIUM", "HARD"] as const;

  for (const session of sessions) {
    const numAttempts = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numAttempts; i++) {
      const isCorrect = Math.random() > 0.25;
      const difficulty = difficulties[Math.floor(Math.random() * 3)];
      const responseTimeMs = 1500 + Math.floor(Math.random() * 6000);

      await prisma.attempt.create({
        data: {
          id: uid(),
          sessionId: session.id,
          questionId: `q-${session.gameId.slice(0, 8)}-${i + 1}`,
          correct: isCorrect,
          responseTimeMs,
          difficulty,
          score: isCorrect ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4,
          selectedAnswer: isCorrect ? "correct_option" : `wrong_option_${Math.floor(Math.random() * 3) + 1}`,
          metadata: {
            questionIndex: i,
            totalQuestions: numAttempts,
            gameType: session.gameId,
          },
        },
      });
    }
  }

  console.log("Attempts created");

  // ─── Insights ─────────────────────────────────────────────────────────────────

  const cognitiveDomains = ["OBJECT_MATCH", "ROUTINE_SEQUENCING", "PATTERN_RECALL", "WHO_IS_CALLING", "REMEMBER_WHEN", "MY_DAILY_ROUTINE"];

  for (const patient of [patient1, patient2]) {
    for (const domain of cognitiveDomains) {
      let ability = 0.4 + Math.random() * 0.3;
      for (let i = 0; i < 5; i++) {
        ability += (Math.random() - 0.3) * 0.1;
        ability = Math.max(0.1, Math.min(0.95, ability));

        const trend = ability > 0.7 ? "IMPROVING" : ability > 0.4 ? "STABLE" : "DECLINING";

        await prisma.insight.create({
          data: {
            id: uid(),
            patientId: patient.id,
            cognitiveDomain: domain,
            abilityEstimate: ability,
            currentValue: ability,
            trend: trend as "IMPROVING" | "STABLE" | "DECLINING",
            explanation: `${domain.replace(/_/g, " ").toLowerCase()} ability is ${trend.toLowerCase()}. Current estimated ability: ${Math.round(ability * 100)}%.`,
            modelVersion: "v1.0",
            createdAt: new Date(now.getTime() - 86400000 * (30 - i * 6)),
          },
        });
      }
    }
  }

  console.log("Insights created");

  // ─── Reminders ────────────────────────────────────────────────────────────────

  await prisma.reminder.createMany({
    data: [
      {
        id: uid(),
        patientId: patient1.id,
        type: "MEDICATION",
        title: "Evening Medication",
        message: "Time to take your evening blood pressure medication.",
        scheduledAt: new Date(now.getTime() + 3600000 * 4),
        repeatRule: "DAILY",
        active: true,
      },
      {
        id: uid(),
        patientId: patient1.id,
        type: "HYDRATION",
        title: "Drink Water",
        message: "Remember to drink a glass of water.",
        scheduledAt: new Date(now.getTime() + 3600000 * 2),
        repeatRule: "DAILY",
        active: true,
      },
      {
        id: uid(),
        patientId: patient2.id,
        type: "ACTIVITY",
        title: "Morning Walk",
        message: "Time for your morning walk in the garden.",
        scheduledAt: new Date(now.getTime() + 86400000),
        repeatRule: "DAILY",
        active: true,
      },
      {
        id: uid(),
        patientId: patient2.id,
        type: "APPOINTMENT",
        title: "Doctor Visit",
        message: "Upcoming appointment with Dr. Kalita next Monday.",
        scheduledAt: new Date(now.getTime() + 86400000 * 5),
        repeatRule: "NONE",
        active: true,
      },
    ],
  });

  console.log("Reminders created");

  // ─── Alerts ───────────────────────────────────────────────────────────────────

  await prisma.alert.create({
    data: {
      id: uid(),
      patientId: patient3.id,
      type: "SUGGESTED_CLINICAL_REVIEW",
      severity: "MEDIUM",
      message: "Sunita Devi has shown declining performance in pattern recall over the last 3 sessions. Consider a clinical review.",
      status: "ACTIVE",
    },
  });

  await prisma.alert.create({
    data: {
      id: uid(),
      patientId: patient1.id,
      type: "CAREGIVER_SUPPORT",
      severity: "LOW",
      message: "Caregiver Anita Sharma has reported mixed moods recently. Consider checking in.",
      status: "ACKNOWLEDGED",
    },
  });

  console.log("Alerts created");

  // ─── Mood Checkins ────────────────────────────────────────────────────────────

  await prisma.caregiverMoodCheckin.createMany({
    data: [
      { id: uid(), patientId: patient1.id, mood: "HAPPY", notes: "Lakshmi enjoyed the Object Match game today." },
      { id: uid(), patientId: patient1.id, mood: "NEUTRAL", notes: "Routine day, no issues." },
      { id: uid(), patientId: patient1.id, mood: "HAPPY", notes: "Great session with Who Is Calling game." },
      { id: uid(), patientId: patient2.id, mood: "SAD", notes: "Gopal was restless today, didn't want to play." },
      { id: uid(), patientId: patient2.id, mood: "NEUTRAL", notes: "Moderate engagement." },
      { id: uid(), patientId: patient2.id, mood: "HAPPY", notes: "Good session with Routine Sequencing." },
    ],
  });

  console.log("Mood checkins created");

  console.log("\nSeeding completed successfully!");
  console.log(`Created: 5 users, 4 patients, 6 games, ${sessions.length} sessions, 12 insights`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
