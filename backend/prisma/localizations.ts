import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export interface LocalizationPack {
  name: string;
  description: string;
  instructions: string[];
}

export type LocalizationCatalog = Record<string, Record<string, LocalizationPack>>;

export const LOCALIZED_GAMES: Array<{ slug: string; packs: Record<string, LocalizationPack> }> = [
  {
    slug: "object-match",
    packs: {
      bengali: {
        name: "বস্তু মেলান",
        description: "একই রকমের বস্তু জোড়া মেলান। ছবি দেখে মিল খুঁজে স্মৃতিশক্তি বাড়ান।",
        instructions: ["ছবিটি ভালো করে দেখুন", "একই রকমের বস্তুটি খুঁজুন", "সঠিক জোড়াটি মেলান"],
      },
      meitei: {
        name: "Pot Yennaba",
        description: "Khudak leitana pot khudak yengba. Mithum yengshinbada semgatnaba.",
        instructions: ["Mithum adu yengbiyu", "Pot khudak khudakta pamyu", "Mnagumba adu yannabi yu"],
      },
    },
  },
  {
    slug: "routine-sequencing",
    packs: {
      bengali: {
        name: "রুটিন সাজান",
        description: "সকাল থেকে রাত পর্যন্ত দৈনন্দিন কাজগুলো সঠিক ক্রমে সাজান।",
        instructions: ["কাজগুলোর ছবি দেখুন", "কোনটি আগে হয় ভাবুন", "সঠিক ক্রমে সাজান"],
      },
      meitei: {
        name: "Nungai Thabak Pareng",
        description: "Ayukki thabak singda khudak yan sambishi yu. Nungai thabak adu thakta thakta leibi.",
        instructions: ["Thabak gi mithum sing yengbiyu", "Kari hanna touge henna yangchanbiyu", "Pareng lei hanna da toubiyu"],
      },
    },
  },
  {
    slug: "pattern-recall",
    packs: {
      bengali: {
        name: "ধাঁচ মনে রাখুন",
        description: "ছবির ধাঁচগুলো মনে রাখুন এবং সঠিক উত্তর দিন।",
        instructions: ["ধাঁচটি লক্ষ্য করুন", "মনে রাখার চেষ্টা করুন", "সঠিক ধাঁচটি বেছে নিন"],
      },
      meitei: {
        name: "Mithum Ningshingba",
        description: "Mithum singda ningshingthokpada yenglaba thadok pa. Ningshingbagi thoujal thokna thagammei.",
        instructions: ["Mithum adu ningshina yengbiyu", "Thiba yaningbe ningshingbiyu", "Mnagumba mithum khudak khorou"],
      },
    },
  },
  {
    slug: "whos-calling",
    packs: {
      bengali: {
        name: "কে ডাকছে?",
        description: "কণ্ঠ শুনে চিনুন কে ডাকছে — আপনার পরিবারের কারো ডাক।",
        instructions: ["কণ্ঠটি শুনুন", "পরিচিত কার কণ্ঠ ভাবুন", "সঠিক উত্তরটি বেছে নিন"],
      },
      meitei: {
        name: "Kanano Kouriba?",
        description: "Khonjel tarira kanano kouriba khangbiyu — nakhuda imung manung gi khonjel.",
        instructions: ["Khonjel adu taryu", "Kana khanghalli yu", "Akhangba khudak adu khorou"],
      },
    },
  },
  {
    slug: "remember-when",
    packs: {
      bengali: {
        name: "মনে আছে?",
        description: "পুরনো দিনের স্মৃতি মনে করে সঠিক উত্তর দিন।",
        instructions: ["প্রশ্নটি শুনুন", "পুরনো স্মৃতি মনে করুন", "সঠিক উত্তর বেছে নিন"],
      },
      meitei: {
        name: "Ningshibra?",
        description: "Nungai ningshingliba adu ningshina akhangba thadok hangbiyu.",
        instructions: ["Hangba adu taryu", "Nungai ningshingliba da ningshina", "Akhangba thadok khudak khorou"],
      },
    },
  },
  {
    slug: "my-daily-routine",
    packs: {
      bengali: {
        name: "আমার দৈনন্দিন রুটিন",
        description: "আপনার নিজের রুটিনের ছবি সাজিয়ে স্মৃতিকে জাগিয়ে তুলুন।",
        instructions: ["ছবিগুলো দেখুন", "নিজের রুটিন মনে করুন", "সঠিক ক্রমে সাজান"],
      },
      meitei: {
        name: "Ei Nungai Thabak",
        description: "Nakhoigi masagi nungai thabak gi mithum da semgatnaba thagatbiyu.",
        instructions: ["Mithum sing yengbiyu", "Masagi nungai thabak ningshina", "Pareng lei hanna da sembiyu"],
      },
    },
  },
];

export async function upsertLocalizations(
  prisma: PrismaClient,
  gamesBySlug: Map<string, { id: string; slug: string }>,
): Promise<void> {
  for (const { slug, packs } of LOCALIZED_GAMES) {
    const game = gamesBySlug.get(slug);
    if (!game) continue;

    for (const [language, pack] of Object.entries(packs)) {
      const audio = `/assets/audio/${language}/${game.slug}.mp3`;
      const data = {
        name: pack.name,
        description: pack.description,
        instructions: { steps: pack.instructions, audioGuidanceUrl: audio },
        audioPackUrl: audio,
      };

      await prisma.gameLocalization.upsert({
        where: { gameId_language: { gameId: game.id, language } },
        update: data,
        create: {
          id: uuidv4(),
          gameId: game.id,
          language,
          ...data,
        },
      });
    }
  }
}