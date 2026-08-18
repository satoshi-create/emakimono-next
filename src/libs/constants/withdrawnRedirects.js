/**
 * 公開取り下げスラッグ → 近い現行ページへの 301。
 * next.config.js から require する（CJS）。
 */
function buildWithdrawnScrollRedirects() {
  return [
    {
      source: "/jigokusoushi_genke",
      destination: "/jigokusoushi_anzyuin",
      permanent: true,
    },
    {
      source: "/frolicking_animals_and_tengu_goblins",
      destination: "/chouju-giga/chapters",
      permanent: true,
    },
  ];
}

module.exports = { buildWithdrawnScrollRedirects };
