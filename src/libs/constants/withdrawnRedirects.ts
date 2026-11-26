type WithdrawnScrollRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

/**
 * 公開取り下げスラッグ → 近い現行ページへの 301。
 * next.config.js は Node から参照するため redirects 定義を同期でインライン化している。
 */
export function buildWithdrawnScrollRedirects(): WithdrawnScrollRedirect[] {
  return [
    {
      source: "/jigokusoushi_genke",
      destination: "/jigokusoushi_anzyuin",
      permanent: true,
    },
    {
      source: "/frolicking_animals_and_tengu_goblins",
      destination: "/hub/chouju-giga",
      permanent: true,
    },
  ];
}
