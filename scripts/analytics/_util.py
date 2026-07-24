"""URL / pagePath normalization — mirrors _app.js PV slug logic (+ URL decode for GSC)."""

from __future__ import annotations

import unicodedata
from urllib.parse import unquote, urlparse

_EMPTY_SLUGS = frozenset({"", "ja", "en"})


def normalize_slug(
    path_or_url: str,
    *,
    strip_prefixes: list[str] | None = None,
) -> str:
    """Convert page URL or pagePath to content slug (titleen).

    Examples:
      https://emakimono.com/ja/foo -> foo
      /ja/foo -> foo
      /foo -> foo
      .../Ch%C5%8Dj%C5%AB-jinbutsu-giga_first -> Chōjū-jinbutsu-giga_first
    """
    if not path_or_url:
        return ""

    if path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        path = urlparse(path_or_url).path
    else:
        path = path_or_url

    path = path.split("?", 1)[0].split("#", 1)[0]
    path = unquote(path)
    if not path.startswith("/"):
        path = "/" + path

    prefixes = strip_prefixes or ["/ja", "/en"]
    for prefix in prefixes:
        if prefix and path.startswith(prefix + "/"):
            path = path[len(prefix) :]
            break

    slug = unicodedata.normalize("NFC", path.strip("/"))
    if slug in _EMPTY_SLUGS:
        return ""
    return slug
