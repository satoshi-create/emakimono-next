import { fetchSceneLikeCounts, postSceneLike } from "@/libs/api/ugcApi";
import { resolveMotifEditionDetails } from "@/utils/rakuchuMotifClientResolver";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function motifLikeStorageKey(masterId) {
  return `motif_like_${masterId}`;
}

function sceneLikeStorageKey(titleen, spotLikeIndex) {
  return `scene_like_${titleen}_${spotLikeIndex}`;
}

/**
 * @param {string | null | undefined} masterId
 * @param {{ titleen: string, spotLikeIndex: number }[]} editions
 */
function readMotifLikedFromStorage(masterId, editions) {
  if (typeof window === "undefined" || !masterId) return false;
  if (localStorage.getItem(motifLikeStorageKey(masterId)) === "true") {
    return true;
  }
  return editions.some(
    (ed) =>
      localStorage.getItem(sceneLikeStorageKey(ed.titleen, ed.spotLikeIndex)) ===
      "true"
  );
}

/**
 * @param {string | null | undefined} masterId
 */
export function useMotifLike(masterId) {
  const editions = useMemo(() => {
    if (!masterId) return [];
    const details = resolveMotifEditionDetails(masterId);
    return Object.values(details).filter(Boolean);
  }, [masterId]);

  const editionsRef = useRef(editions);
  editionsRef.current = editions;

  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(masterId && editions.length));
  const pendingRef = useRef(false);

  useEffect(() => {
    setLiked(readMotifLikedFromStorage(masterId, editions));
  }, [masterId, editions]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onSync = (event) => {
      if (event?.detail?.masterId !== masterId) return;
      setLiked(Boolean(event.detail.liked));
    };
    window.addEventListener("rakuchu-motif-like-sync", onSync);
    return () => window.removeEventListener("rakuchu-motif-like-sync", onSync);
  }, [masterId]);

  useEffect(() => {
    let isMounted = true;

    if (!masterId || !editions.length) {
      setCount(0);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);

    async function loadCounts() {
      const titleenSet = [...new Set(editions.map((ed) => ed.titleen))];
      let sum = 0;

      await Promise.all(
        titleenSet.map(async (titleen) => {
          const data = await fetchSceneLikeCounts(titleen);
          const counts = data?.counts ?? {};
          for (const ed of editions) {
            if (ed.titleen !== titleen) continue;
            sum += Number(counts[ed.spotLikeIndex] ?? 0);
          }
        })
      );

      if (!isMounted) return;
      setCount(Math.max(0, sum));
      setIsLoading(false);
    }

    loadCounts().catch(() => {
      if (isMounted) {
        setCount(0);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [masterId, editions]);

  const toggleLike = useCallback(async () => {
    if (!masterId || pendingRef.current) return null;
    const linked = editionsRef.current;
    if (!linked.length) return null;

    const currentLiked = readMotifLikedFromStorage(masterId, linked);
    const nextLiked = !currentLiked;
    pendingRef.current = true;

    setLiked(nextLiked);

    if (typeof window !== "undefined") {
      const motifKey = motifLikeStorageKey(masterId);
      if (nextLiked) {
        localStorage.setItem(motifKey, "true");
      } else {
        localStorage.removeItem(motifKey);
      }

      for (const ed of linked) {
        const key = sceneLikeStorageKey(ed.titleen, ed.spotLikeIndex);
        if (nextLiked) {
          localStorage.setItem(key, "true");
        } else {
          localStorage.removeItem(key);
        }
      }

      window.dispatchEvent(
        new CustomEvent("rakuchu-motif-like-sync", {
          detail: { masterId, liked: nextLiked },
        })
      );
    }

    setCount((prev) => Math.max(0, Number(prev) + (nextLiked ? 1 : -1)));

    try {
      await Promise.all(
        linked.map((ed) =>
          postSceneLike({
            emakiId: ed.titleen,
            sceneIndex: ed.spotLikeIndex,
            action: nextLiked ? "like" : "unlike",
          })
        )
      );
    } finally {
      pendingRef.current = false;
    }

    return { liked: nextLiked, ok: true };
  }, [masterId]);

  return { liked, count, toggleLike, isLoading, editions };
}