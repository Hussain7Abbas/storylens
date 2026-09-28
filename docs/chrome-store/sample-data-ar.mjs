import * as english from "./sample-data.mjs";

export const novel = { ...english.novel, name: "أرشيف الفوانيس", description: "حكاية خيالية أصلية عن خريطة مفقودة ومدينة من الأضواء." };
export const categories = english.categories.map(item => ({ ...item, nameEn: item.nameAr }));
export const natures = english.natures.map(item => ({ ...item, nameEn: item.nameAr }));
const names = { mira: "ميرا", rowan: "روان", elian: "إليان", archive: "أرشيف الفوانيس", harbor: "المرفأ الزجاجي", council: "مجلس النجوم", crown: "التاج الرمادي" };
const descriptions = {
  mira: "شابة شجاعة تواصل رحلة أبيها التي لم تكتمل.",
  rowan: "رفيق الرحلة الوفي وحارس فانوس المرفأ.",
  elian: "باحث هادئ اختفى أثناء دراسة خريطة النجوم المفقودة.",
  archive: "مكتبة المدينة العتيقة، تضيئها مصابيح لا تنطفئ.",
  harbor: "مدينة ساحلية تحيط بخليج صاف كمرآة.",
  council: "علماء يحرسون أقدم خرائط المدينة وأسرارها.",
  crown: "رمز غامض خُتمت به رسالة إليان الأخيرة.",
};
export const keywords = english.keywords.map(item => ({ ...item, name: names[item.id] }));
export const versions = english.versions.map(item => ({
  ...item,
  description: item.id === "mira-ch12" ? "أصبحت مؤتمنة على خريطة إليان ومفتاح أرشيف الفوانيس." : descriptions[item.keywordId],
  category: categories.find(category => category.id === item.categoryId),
  nature: natures.find(nature => nature.id === item.natureId),
}));
export const aliases = english.aliases.map(item => ({ ...item, name: "رسام الخرائط", description: "الاسم الذي يُعرف به روان بين رسامي خرائط المرفأ." }));
export const replacements = english.replacements.map(item => ({ ...item, from: "قلادة اليشم", to: "قلادة النجوم" }));
export const selector = english.selector;
