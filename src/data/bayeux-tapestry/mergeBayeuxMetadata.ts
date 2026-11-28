import type { EmakiMetadata } from "@/types/emaki";

export interface BayeuxInscriptionSpot {
  id: string;
  sliceName?: string;
  panel_id?: number;
  kind?: string;
  [key: string]: unknown;
}

export interface BayeuxPanelItem {
  id: number;
  panel_number?: number;
  slice_range?: [number, number];
  [key: string]: unknown;
}

export interface BayeuxPanelsAndInscriptions {
  scrollId: string;
  titleen: string;
  panels: BayeuxPanelItem[];
  inscriptions?: BayeuxInscriptionSpot[];
}

/** メタ JSON と場面解説 JSON を結合し、slice_range に基づいて画像スライスの panel_id / panel_number を同期する */
export function mergeBayeuxScrollMetadata(
  data: EmakiMetadata,
  extra: BayeuxPanelsAndInscriptions
): EmakiMetadata {
  const sliceToPanelId = new Map<number, number>();
  for (const p of extra.panels ?? []) {
    const pid = Number(p.id ?? p.panel_number);
    const range = p.slice_range;
    if (!Number.isFinite(pid) || !Array.isArray(range) || range.length < 2) continue;
    for (let s = Number(range[0]); s <= Number(range[1]); s++) {
      sliceToPanelId.set(s, pid);
    }
  }

  let imgIdx = 0;
  const emakis = data.emakis?.map((item) => {
    if (item.cat !== "image") return item;
    imgIdx += 1;
    const mappedId = sliceToPanelId.get(imgIdx);
    if (mappedId == null) return item;
    return {
      ...item,
      panel_id: mappedId,
      panel_number: mappedId,
    };
  });

  return {
    ...data,
    panels: extra.panels,
    emakis,
  } as EmakiMetadata;
}

/** 編集後の emakis スポットを inscriptions フラット配列に戻す（update-spot 保存用） */
export function inscriptionsFromEmakis(
  emakis: EmakiMetadata["emakis"]
): BayeuxInscriptionSpot[] {
  const out: BayeuxInscriptionSpot[] = [];
  if (!emakis) return out;
  for (const emaki of emakis) {
    if (emaki?.cat !== "image" || !Array.isArray(emaki.spots)) continue;
    for (const spot of emaki.spots) {
      if (!spot?.id) continue;
      out.push({
        ...spot,
        sliceName: String(emaki.name ?? ""),
        panel_id:
          typeof emaki.panel_id === "number" ? emaki.panel_id : undefined,
        kind:
          typeof spot.kind === "string" && spot.kind !== ""
            ? spot.kind
            : "inscription",
      });
    }
  }
  return out;
}