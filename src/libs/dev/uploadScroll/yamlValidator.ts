// === 1. 定数（研究用語 NG・slot 許可・LocalStorage キー） ===
// アップロード画面と同期パイプラインで共有する検証用定数

export function extractYamlScalar(yaml: string, key: string): string {
  const re = new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n#]+)["']?\\s*$`, "m");
  const m = yaml.match(re);
  if (!m) return "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

export const NG_RESEARCH_WORDS = [
  "AC型",
  "Cモジュール",
  "請求記号",
  "真珠庵系",
  "系譜",
  "モジュール脱落",
  "AC-lineage",
  "C-module",
  "call number",
  "Shinju-an lineage",
];

export const ALLOWED_SLOT_TYPES = new Set(["image", "ekotoba"]);

export const UPLOAD_RESULT_STORAGE_KEY = "emakimono_dev_last_upload_result";

// === 2. YAML スカラー・メタ抽出 ===
// scroll 設定 YAML から id / range 終端などを正規表現で抽出

export function formatUploadTimestamp(ts: string | number | Date | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString("ja-JP");
  } catch {
    return String(ts);
  }
}

export function extractYamlNumericId(yaml: string): number | null {
  const m = yaml.match(/^metadata:[\s\S]*?^\s*id:\s*(\d+)/m);
  if (m) return parseInt(m[1], 10);
  const m2 = yaml.match(/^\s*id:\s*(\d+)\s*$/m);
  return m2 ? parseInt(m2[1], 10) : null;
}

export function extractMaxRangeEnd(yaml: string): number {
  let max = 0;
  const re = /range:\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/g;
  let m;
  while ((m = re.exec(yaml))) {
    const end = parseInt(m[2], 10);
    if (Number.isFinite(end) && end > max) max = end;
  }
  return max;
}

// === 3. scroll YAML 総合検証 ===
// 必須キー・研究用語・既存 scroll との id/titleen 衝突・range と画像枚数の警告

type ExistingScrollMeta = { id?: number; titleen?: string; title?: string };

export type ValidateScrollYamlResult = {
  errors: string[];
  warnings: string[];
  overwriteMode: boolean;
};

export function validateScrollYaml(
  yaml: string,
  {
    existingScrolls = [],
    imageCount = 0,
    yamlTitleen = "",
  }: {
    existingScrolls?: ExistingScrollMeta[];
    imageCount?: number;
    yamlTitleen?: string;
  } = {}
): ValidateScrollYamlResult {
  const errors = [];
  const warnings = [];
  const trimmed = (yaml || "").trim();
  if (!trimmed) return { errors, warnings, overwriteMode: false };

  const required: Array<[string, RegExp]> = [
    ["scroll_id", /^scroll_id:/m],
    ["volume_num", /^volume_num:/m],
    ["folder", /^folder:/m],
    ["metadata", /^metadata:/m],
    ["id", /^\s*id:/m],
    ["title", /^\s*title:/m],
    ["titleen", /^\s*titleen:/m],
    ["desc", /^\s*desc:/m],
    ["descen", /^\s*descen:/m],
    ["scenes", /^scenes:/m],
    ["range", /^\s*range:/m],
  ];
  for (const [label, pattern] of required) {
    if (!pattern.test(trimmed)) errors.push(`必須キーがありません: ${label}`);
  }

  if (trimmed.includes("\t")) {
    warnings.push("YAML にタブ文字が含まれています（インデントはスペースのみ推奨）");
  }

  for (const word of NG_RESEARCH_WORDS) {
    if (trimmed.includes(word)) errors.push(`研究用語 NG ワード: 「${word}」`);
  }

  const slotRe = /slot_types:\s*\[([^\]]+)\]/g;
  let sm;
  while ((sm = slotRe.exec(trimmed))) {
    const tokens = sm[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    for (const token of tokens) {
      if (!ALLOWED_SLOT_TYPES.has(token)) {
        errors.push(`不正な slot_types: 「${token}」（許可: image, ekotoba）`);
      }
    }
  }

  const yamlId = extractYamlNumericId(trimmed);
  const titleen = yamlTitleen || extractYamlScalar(trimmed, "titleen");
  let overwriteMode = false;
  if (yamlId != null && existingScrolls.length > 0) {
    const conflict = existingScrolls.find(
      (s) => Number(s.id) === yamlId && String(s.titleen || "") !== String(titleen || "")
    );
    if (conflict) {
      errors.push(
        `id ${yamlId} は既存「${conflict.titleen || conflict.title || "?"}」で使用中です`
      );
    }
  }
  if (titleen) {
    const same = existingScrolls.find((s) => String(s.titleen) === String(titleen));
    if (same) overwriteMode = true;
  }

  const maxRangeEnd = extractMaxRangeEnd(trimmed);
  if (maxRangeEnd > 0 && imageCount > 0 && maxRangeEnd !== imageCount) {
    warnings.push(
      `画像枚数（${imageCount}）と scenes の range 最大終端（${maxRangeEnd}）が一致しません`
    );
  }

  const scenesHead = trimmed.match(/^scenes:\s*([\s\S]*)/m);
  if (scenesHead) {
    const scenesOnly = scenesHead[1].split(/\n(?=^[a-z][\w]*:)/)[0];
    const sceneIdRe = /^\s*(?:-\s*)?id:\s*["']?([^"'\s#]+)["']?/gm;
    let sceneIdMatch;
    while ((sceneIdMatch = sceneIdRe.exec(scenesOnly))) {
      const sceneId = sceneIdMatch[1].trim();
      if (!/^\d+$/.test(sceneId)) {
        errors.push(`scenes の id は整数のみ（sync_scroll 互換）: 「${sceneId}」`);
      }
    }
  }

  return { errors, warnings, overwriteMode };
}