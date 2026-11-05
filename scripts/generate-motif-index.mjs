import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../src/data/emaki-text-data");
const OUTPUT_FILE = path.resolve(__dirname, "../src/data/generated-motif-index.json");

function buildMotifIndex() {
  if (!fs.existsSync(DATA_DIR)) {
    console.warn(`[generate-motif-index] Directory not found: ${DATA_DIR}`);
    return;
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".bak"));
  const motifIndex = {};

  for (const file of files) {
    const slug = path.basename(file, ".json");
    const filePath = path.join(DATA_DIR, file);

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const content = JSON.parse(raw);
      const chapters = Array.isArray(content) ? content : (content.chapters || content.emakis || []);

      if (!Array.isArray(chapters)) continue;

      const ekotobas = chapters.filter((e) => e && e.cat === "ekotoba");

      chapters.forEach((item) => {
        if (!item || !item.sou || !Array.isArray(item.sou.motifs)) return;

        let visitorScene = 1;
        const ekotobaIndex = ekotobas.findIndex(
          (e) => String(e.chapter) === String(item.chapter)
        );

        if (ekotobaIndex !== -1) {
          visitorScene = ekotobaIndex + 1;
        } else if (slug.toLowerCase().includes("kusouzu") && !Number.isNaN(Number(item.chapter))) {
          visitorScene = Number(item.chapter) + 1;
        } else {
          visitorScene = Number(item.chapter) || 1;
        }

        const entry = {
          titleen: slug,
          chapter: item.chapter,
          visitorScene,
          title: item.title || `${slug}（第${item.chapter}段）`,
          chapterTitle: item.chapterTitle || item.title || "",
          thumb: item.thumb || "",
          prompt: item.sou.prompt || null,
        };

        item.sou.motifs.forEach((motifId) => {
          if (!motifId) return;
          if (!motifIndex[motifId]) {
            motifIndex[motifId] = [];
          }
          motifIndex[motifId].push(entry);
        });
      });
    } catch (err) {
      console.error(`[generate-motif-index] Error parsing ${file}:`, err.message);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(motifIndex, null, 2), "utf-8");
  console.log(`[generate-motif-index] Successfully indexed ${Object.keys(motifIndex).length} motifs to ${OUTPUT_FILE}`);
}

buildMotifIndex();
