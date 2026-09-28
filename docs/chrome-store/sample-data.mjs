// Fictional data for a disposable browser profile. Never sync this to production.
const timestamp = "2026-09-27T00:00:00.000Z";
const audit = { createdAt: timestamp, updatedAt: timestamp, createdById: "sample-reader" };
export const novel = { ...audit, id: "sample-lantern-archive", name: "The Lantern Archive", description: "An original fantasy story about a missing map and a city of lights.", slugs: ["the-lantern-archive"], imageId: null, downloadedAt: Date.parse(timestamp) };
export const categories = [
  { id: "character", nameEn: "Character", nameAr: "شخصية", color: "#6554c0", description: "People in the story", createdAt: timestamp, updatedAt: timestamp },
  { id: "place", nameEn: "Place", nameAr: "مكان", color: "#26705e", description: "Locations in the story", createdAt: timestamp, updatedAt: timestamp },
  { id: "faction", nameEn: "Faction", nameAr: "جماعة", color: "#b06427", description: "Groups and organizations", createdAt: timestamp, updatedAt: timestamp },
  { id: "artifact", nameEn: "Artifact", nameAr: "قطعة أثرية", color: "#a83d68", description: "Objects with a story", createdAt: timestamp, updatedAt: timestamp },
];
export const natures = [
  { id: "ally", nameEn: "Ally", nameAr: "حليف", color: "#26705e", description: "An ally of the protagonist", createdAt: timestamp, updatedAt: timestamp },
  { id: "unknown", nameEn: "Unknown", nameAr: "مجهول", color: "#656779", description: "Motives are not yet known", createdAt: timestamp, updatedAt: timestamp },
  { id: "neutral", nameEn: "Neutral", nameAr: "محايد", color: "#656779", description: "A neutral part of the story", createdAt: timestamp, updatedAt: timestamp },
];
const entries = [
  ["mira", "Mira", "character", "The young mapmaker following her father's unfinished journey.", "ally"],
  ["rowan", "Rowan", "character", "Mira's loyal companion and the keeper of the harbor lantern.", "ally"],
  ["elian", "Elian", "character", "A quiet scholar who disappeared while studying the lost star map.", "unknown"],
  ["archive", "Lantern Archive", "place", "The city's ancient library, lit by lamps that never go dark.", "neutral"],
  ["harbor", "Glass Harbor", "place", "A coastal city built around a sheltered, mirror-bright bay.", "neutral"],
  ["council", "Star Council", "faction", "The scholars who guard the city's oldest maps and secrets.", "unknown"],
  ["crown", "Ashen Crown", "artifact", "A mysterious emblem stamped on Elian's final letter.", "neutral"],
];
export const keywords = entries.map(([id, name]) => ({ ...audit, id, name, novelId: novel.id, matchingType: "FULL", aliases: [], versions: [] }));
export const versions = entries.map(([id, , categoryId, description, natureId]) => ({ ...audit, id: `${id}-base`, keywordId: id, description, startingChapter: "1", endingChapter: null, categoryId, natureId, imageId: null, category: categories.find(c => c.id === categoryId), nature: natures.find(n => n.id === natureId) ?? null, image: null }));
versions.push({ ...versions[0], id: "mira-ch12", description: "Now entrusted with Elian's star map and the key to the Lantern Archive.", startingChapter: "12", endingChapter: null });
versions[0].endingChapter = "11";
export const aliases = [{ ...audit, id: "rowan-cartographer", keywordId: "rowan", name: "Cartographer", description: "Rowan's name among the harbor mapmakers.", matchingType: "FULL", overrideStyle: false, categoryId: null, natureId: null, imageId: null, category: null, nature: null, image: null }];
export const replacements = [{ ...audit, id: "jade-starlight", novelId: novel.id, from: "jade pendant", to: "starlight pendant", matchingType: "FULL", keywordId: null, keyword: null }];
export const selector = { website: "127.0.0.1", novel: { url: { regex: "/novels/([^/]+)/" } }, chapter: { url: { regex: "/chapters/(\\d+)" } } };
