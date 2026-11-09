/**
 * =============================================================================
 * emakiSceneDom.js
 * =============================================================================
 * 画面（ビューポート）にレンダリングされた実際の DOM 要素（section#scene-N）の
 * 物理位置（BoundingClientRect）をサンプリングし、現在の中央シーン番号を特定するユーティリティ。
 * 机上計算ではなくブラウザの「実測値」を正本とする。
 */

// =============================================================================
// デバッグスイッチ
// 検証完了後は false にすることで、すべてのコンソール出力を一括で停止できます。
// =============================================================================
const DEBUG_SCENE_DOM = true;

function logSceneDom(tag, ...args) {
  if (!DEBUG_SCENE_DOM) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][SceneDom:${tag}]`, "color: #8b5cf6; font-weight: bold;", ...args);
}

/**
 * シーン DOM id の生成。
 * URL hash `#N` と衝突させないため `scene-N` を使う。
 * （数値 id だとブラウザ標準のアンカー挙動で縦スクロールし、ヘッダーが隠れるため）
 */
export function sceneSectionId(index) {
  return `scene-${index}`;
}

/**
 * section.id 文字列（例: "scene-3"）からシーン番号の整数（例: 3）をパースする。
 * パターンに合致しない不正な id の場合は NaN を返す。
 */
export function parseSceneSectionId(id) {
  const m = String(id || "").match(/^scene-(\d+)$/);
  return m ? parseInt(m[1], 10) : NaN;
}

/**
 * 指定したインデックスに対応する DOM 要素（<section id="scene-N">）を直接取得する。
 */
export function querySceneSection(index) {
  if (typeof document === "undefined") return null;
  return document.querySelector(`section[id="${sceneSectionId(index)}"]`);
}

/**
 * 【最重要関数】
 * 現在のビューポートの水平中央（画面真ん中）に載っている `section#scene-N` の番号（N）を返す。
 * URL hash / navIndex / ポラロイドUI起動時の正本として機能する。
 *
 * @param {HTMLElement | null} container スクロールコンテナ（Fallback 探索用）
 * @returns {number | null} 特定できたシーン番号、特定不能時は null
 */
export function findSceneIndexAtViewportCenter(container) {
  // SSR（サーバーサイド実行時）またはコンテナ未指定時は即座に中断
  if (typeof window === "undefined" || !container) {
    logSceneDom("FindCenter:Skip", { hasWindow: typeof window !== "undefined", hasContainer: Boolean(container) });
    return null;
  }

  // ---------------------------------------------------------------------------
  // [ステップ 1] ビューポート（ブラウザ画面）の幾何学的中心座標 (cx, cy) を取得
  // ---------------------------------------------------------------------------
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  logSceneDom("FindCenter:ViewportCenter", { cx, cy, innerWidth: window.innerWidth, innerHeight: window.innerHeight });

  // ---------------------------------------------------------------------------
  // [ステップ 2: 第1探索（最速ルート）] elementsFromPoint による直接ヒットテスト
  // 画面中央 (cx, cy) の直下に重なっている DOM 要素スタックを最前面から取得する
  // ---------------------------------------------------------------------------
  const elements = document.elementsFromPoint(cx, cy);
  for (const el of elements) {
    // 中央の要素またはその親要素が <section id="scene-..."> であるか判定
    const section = el.closest?.('section[id^="scene-"]');
    if (section) {
      const id = parseSceneSectionId(section.id);
      if (!isNaN(id)) {
        logSceneDom("FindCenter:HitViaPoint", {
          hitId: id,
          sectionId: section.id,
          targetTagName: el.tagName,
        });
        return id;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // [ステップ 3: 第2探索（Fallback ルート）] BoundingClientRect による全スライス走査
  // オーバーレイ（UIや影）が画面中央を覆っていて elementsFromPoint が弾かれた場合、
  // コンテナ内の全 section を走査し、物理的に水平中心 (cx) を挟んでいる要素を探す
  // ---------------------------------------------------------------------------
  logSceneDom("FindCenter:FallbackScanning", "elementsFromPoint で未検出のため、全sectionの境界ボックスを走査します");

  const sections = container.querySelectorAll('section[id^="scene-"]');
  logSceneDom("FindCenter:SectionsFound", { count: sections.length });

  for (const sec of sections) {
    const rect = sec.getBoundingClientRect();

    // 水平中央 (cx) が要素の左端 (rect.left) と右端 (rect.right) の間に入っているか判定
    if (rect.left <= cx && rect.right >= cx) {
      const id = parseSceneSectionId(sec.id);
      if (!isNaN(id)) {
        logSceneDom("FindCenter:HitViaRect", {
          hitId: id,
          sectionId: sec.id,
          rect: { left: rect.left.toFixed(1), right: rect.right.toFixed(1), width: rect.width.toFixed(1) },
        });
        return id;
      }
    }
  }

  // 画面中央に該当するセクションが存在しない（余白や読み込み前など）
  logSceneDom("FindCenter:NotFound", "ビューポート中央に重なる section が見つかりませんでした (null を返却)");
  return null;
}