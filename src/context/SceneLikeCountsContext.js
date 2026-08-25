import { fetchSceneLikeCounts, postSceneLike } from "@/libs/api/ugcApi";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const noop = () => {};
const asyncNoop = async () => null;

const defaultSceneLikeCountsContext = {
  getCount: () => 0,
  isLiked: () => false,
  hydrateLiked: noop,
  toggleLike: asyncNoop,
  isLoading: false,
};

export const SceneLikeCountsContext = createContext(
  defaultSceneLikeCountsContext
);

function storageKeyFor(emakiId, sceneIndex) {
  return `scene_like_${emakiId}_${sceneIndex}`;
}

export function SceneLikeCountsProvider({ emakiId, children }) {
  const [counts, setCounts] = useState({});
  const [liked, setLiked] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const likedRef = useRef({});
  const pendingRef = useRef({});

  useEffect(() => {
    likedRef.current = liked;
  }, [liked]);

  useEffect(() => {
    let isMounted = true;
    setLiked({});
    likedRef.current = {};
    pendingRef.current = {};

    async function loadCounts() {
      setIsLoading(true);
      const data = await fetchSceneLikeCounts(emakiId);
      if (!isMounted) return;
      setCounts(data?.counts ?? {});
      setIsLoading(false);
    }

    loadCounts();

    return () => {
      isMounted = false;
    };
  }, [emakiId]);

  const hydrateLiked = useCallback(
    (sceneIndex) => {
      if (typeof window === "undefined") return;
      if (Object.prototype.hasOwnProperty.call(likedRef.current, sceneIndex)) {
        return;
      }
      const saved =
        localStorage.getItem(storageKeyFor(emakiId, sceneIndex)) === "true";
      setLiked((prev) => {
        if (Object.prototype.hasOwnProperty.call(prev, sceneIndex)) return prev;
        const next = { ...prev, [sceneIndex]: saved };
        likedRef.current = next;
        return next;
      });
    },
    [emakiId]
  );

  const toggleLike = useCallback(
    async (sceneIndex) => {
      if (pendingRef.current[sceneIndex]) return null;

      const key = storageKeyFor(emakiId, sceneIndex);
      const current = Object.prototype.hasOwnProperty.call(
        likedRef.current,
        sceneIndex
      )
        ? Boolean(likedRef.current[sceneIndex])
        : typeof window !== "undefined" &&
          localStorage.getItem(key) === "true";
      const nextLiked = !current;

      pendingRef.current[sceneIndex] = true;

      setLiked((prev) => {
        const updated = { ...prev, [sceneIndex]: nextLiked };
        likedRef.current = updated;
        return updated;
      });

      if (typeof window !== "undefined") {
        if (nextLiked) {
          localStorage.setItem(key, "true");
        } else {
          localStorage.removeItem(key);
        }
      }

      setCounts((prev) => {
        const currentCount = Number(prev[sceneIndex] ?? 0);
        return {
          ...prev,
          [sceneIndex]: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
        };
      });

      const result = await postSceneLike({
        emakiId,
        sceneIndex,
        action: nextLiked ? "like" : "unlike",
      });

      pendingRef.current[sceneIndex] = false;

      if (result?.count != null) {
        setCounts((prev) => ({
          ...prev,
          [sceneIndex]: Math.max(0, Number(result.count) || 0),
        }));
        return { liked: nextLiked, ok: true };
      }

      if (!result) {
        setLiked((prev) => {
          const updated = { ...prev, [sceneIndex]: current };
          likedRef.current = updated;
          return updated;
        });
        if (typeof window !== "undefined") {
          if (current) {
            localStorage.setItem(key, "true");
          } else {
            localStorage.removeItem(key);
          }
        }
        setCounts((prev) => {
          const currentCount = Number(prev[sceneIndex] ?? 0);
          return {
            ...prev,
            [sceneIndex]: Math.max(0, currentCount + (nextLiked ? -1 : 1)),
          };
        });
        return { liked: current, ok: false };
      }

      return { liked: nextLiked, ok: true };
    },
    [emakiId]
  );

  const value = useMemo(
    () => ({
      getCount: (sceneIndex) => Number(counts[sceneIndex] ?? 0),
      isLiked: (sceneIndex) => Boolean(liked[sceneIndex]),
      hydrateLiked,
      toggleLike,
      isLoading,
    }),
    [counts, liked, hydrateLiked, toggleLike, isLoading]
  );

  return (
    <SceneLikeCountsContext.Provider value={value}>
      {children}
    </SceneLikeCountsContext.Provider>
  );
}

export function useSceneLikeCounts() {
  return useContext(SceneLikeCountsContext);
}
