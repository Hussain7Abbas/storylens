export const locales = {
  en: {
    port: 4178, launcherX: 1212, chapter: "chapter.html", data: "sample-data.mjs",
    search: "Search", mira: "Mira", rowan: "Rowan", alias: "Cartographer", replacing: "Replacing", coloring: "Coloring", cancel: "Cancel", save: "Save", description: "Description", replacement: "starlight pendant", savedNote: "Mira's trusted guide through the Lantern Archive.",
    captions: ["Read with color-coded characters, places and factions", "Recognize alternative names for each character", "See character notes for your current chapter", "Replace words with your preferred terms", "Edit your character reference while you read", "Save a character note locally, even while offline"],
  },
  ar: {
    port: 4179, launcherX: 16, chapter: "chapter-ar.html", data: "sample-data-ar.mjs",
    search: "البحث", mira: "ميرا", rowan: "روان", alias: "رسام الخرائط", replacing: "استبدال", coloring: "تلوين", cancel: "إلغاء", save: "حفظ", description: "الوصف", replacement: "قلادة النجوم", savedNote: "رفيق ميرا الموثوق ودليلها عبر أرشيف الفوانيس.",
    captions: ["اقرأ مع تلوين الشخصيات والأماكن والجماعات", "تعرّف على الأسماء البديلة لكل شخصية", "تابع معلومات الشخصية حسب الفصل الحالي", "استبدل الكلمات بالمصطلحات التي تفضّلها", "عدّل معلومات الشخصيات أثناء القراءة", "احفظ ملاحظاتك محلياً حتى دون اتصال"],
  },
};
export const locale = process.argv.includes("--ar") ? "ar" : "en";
export const labels = locales[locale];
