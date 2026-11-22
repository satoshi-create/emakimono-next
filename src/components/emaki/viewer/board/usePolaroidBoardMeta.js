import { useEffect, useState } from "react";
import {
  listPersonalBoards,
  createPersonalBoard,
  updatePersonalBoardMeta,
  DEFAULT_PERSONAL_BOARD,
} from "./polaroidBoardStorage";
import {
  createCollabBoard,
  fetchPublicBoards,
  updateCollabBoardMeta,
  updateCollabBoardTitle,
} from "@/libs/api/ugcApi";
import { AUTHOR_NAME_KEY } from "./polaroidBoardHelpers";

const LAST_PUBLIC_BOARD_KEY = "emakimono_last_public_board_v1";
const LAST_PERSONAL_BOARD_KEY = "emakimono_last_personal_board_v1";

function parseDescriptionAndHubs(raw) {
  const text = String(raw || "");
  const match = text.match(/\n?<!--hubs:([^>]*)-->/);
  const relatedHubs = match
    ? match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const cleanDescription = text.replace(/\n?<!--hubs:[^>]*-->/, "").trimEnd();
  return { cleanDescription, relatedHubs };
}

function serializeDescriptionAndHubs(desc, hubs) {
  const cleanDesc = String(desc || "")
    .replace(/\n?<!--hubs:[^>]*-->/g, "")
    .trim();
  const list = Array.isArray(hubs) ? hubs.filter(Boolean) : [];
  if (list.length === 0) return cleanDesc;
  return `${cleanDesc}\n<!--hubs:${list.join(",")}-->`;
}

export function usePolaroidBoardMeta({
  router,
  isCollabMode,
  roomParam,
  personalParam,
  collabBoard,
  setCollabBoard,
  setRoomError,
}) {
  const [collabTitleDraft, setCollabTitleDraft] = useState("");
  const [personalMeta, setPersonalMeta] = useState({
    title: DEFAULT_PERSONAL_BOARD.title,
    description: DEFAULT_PERSONAL_BOARD.description,
    relatedHubs: [],
  });
  const [personalBoardList, setPersonalBoardList] = useState([]);
  const [themePublicBoards, setThemePublicBoards] = useState([]);

  const activeTabKey = isCollabMode
    ? `public:${roomParam}`
    : `personal:${personalParam || "default"}`;

  const visibleTabs = isCollabMode
    ? themePublicBoards.map((b) => ({
        key: `public:${b.id}`,
        type: "public",
        id: b.id,
        title: b.title,
        href: `/board?room=${encodeURIComponent(b.id)}`,
      }))
    : personalBoardList.map((b) => ({
        key: `personal:${b.id}`,
        type: "personal",
        id: b.id,
        title: b.title,
        href:
          b.id === "default"
            ? "/board"
            : `/board?personal=${encodeURIComponent(b.id)}`,
      }));

  const parsedCollab = parseDescriptionAndHubs(collabBoard?.description || "");

  const handleSavePersonalTitle = () => {
    const nextTitle = String(personalMeta.title || "").trim();
    if (!nextTitle) return;
    const saved = updatePersonalBoardMeta(personalParam || "default", {
      title: nextTitle,
      description: personalMeta.description,
    });
    setPersonalMeta({
      title: saved.title,
      description: saved.description || "",
      relatedHubs: Array.isArray(saved.relatedHubs) ? saved.relatedHubs : personalMeta.relatedHubs || [],
    });
  };

  const handleSavePersonalDescription = (rawDescription) => {
    const nextDesc = String(rawDescription || "").trim().slice(0, 240);
    const saved = updatePersonalBoardMeta(personalParam || "default", {
      title: personalMeta.title,
      description: nextDesc,
    });
    setPersonalMeta({
      title: saved.title,
      description: saved.description || "",
      relatedHubs: Array.isArray(saved.relatedHubs) ? saved.relatedHubs : personalMeta.relatedHubs || [],
    });
  };

  const handleSavePersonalRelatedHubs = (nextSlugs) => {
    const saved = updatePersonalBoardMeta(personalParam || "default", {
      relatedHubs: nextSlugs,
    });
    setPersonalMeta((prev) => ({
      ...prev,
      relatedHubs: Array.isArray(saved.relatedHubs) ? saved.relatedHubs : nextSlugs,
    }));
  };

  const handleSaveCollabTitle = async () => {
    if (!roomParam || !collabTitleDraft.trim()) return;
    try {
      await updateCollabBoardTitle(roomParam, collabTitleDraft.trim());
      setCollabBoard((prev) => (prev ? { ...prev, title: collabTitleDraft.trim() } : prev));
    } catch {
      // ignore
    }
  };

  const handleSaveCollabDescription = async (rawDescription) => {
    if (!collabBoard?.id) return;
    const { relatedHubs: currentHubs, cleanDescription } = parseDescriptionAndHubs(
      collabBoard.description || ""
    );
    const nextDesc = String(rawDescription || "").trim();
    if (nextDesc === cleanDescription) return;
    const serialized = serializeDescriptionAndHubs(nextDesc, currentHubs);
    try {
      await updateCollabBoardMeta(collabBoard.id, {
        description: serialized,
      });
      setCollabBoard((prev) =>
        prev ? { ...prev, description: serialized } : prev
      );
    } catch (err) {
      setRoomError(err.message || "テーマ説明の更新に失敗しました");
    }
  };

  const handleSaveCollabRelatedHubs = async (nextSlugs) => {
    if (!collabBoard?.id) return;
    const { cleanDescription } = parseDescriptionAndHubs(collabBoard.description || "");
    const serialized = serializeDescriptionAndHubs(cleanDescription, nextSlugs);
    try {
      await updateCollabBoardMeta(collabBoard.id, {
        description: serialized,
      });
      setCollabBoard((prev) =>
        prev ? { ...prev, description: serialized } : prev
      );
    } catch (err) {
      setRoomError(err.message || "関連ハブの更新に失敗しました");
    }
  };

  useEffect(() => {
    setPersonalBoardList(listPersonalBoards());
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPublicBoards();
        if (!cancelled) {
          setThemePublicBoards(Array.isArray(res?.boards) ? res.boards : []);
        }
      } catch {
        if (!cancelled) setThemePublicBoards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCollabMode, roomParam, personalParam, collabBoard?.title, personalMeta?.title]);

  useEffect(() => {
    if (typeof window === "undefined" || !router.isReady) return;
    try {
      if (isCollabMode && roomParam) {
        window.sessionStorage.setItem(LAST_PUBLIC_BOARD_KEY, roomParam);
      } else if (!isCollabMode) {
        window.sessionStorage.setItem(
          LAST_PERSONAL_BOARD_KEY,
          personalParam || "default"
        );
      }
    } catch {
      // sessionStorage 失敗は無視
    }
  }, [router.isReady, isCollabMode, roomParam, personalParam]);

  const handleSelectTab = (tab) => {
    if (!tab?.href) return;
    router.push(tab.href, undefined, { locale: router.locale });
  };

  const handleSwitchToPublicBoard = async () => {
    let list = themePublicBoards;
    if (list.length === 0) {
      try {
        const res = await fetchPublicBoards();
        list = Array.isArray(res?.boards) ? res.boards : [];
        setThemePublicBoards(list);
      } catch {
        list = [];
      }
    }
    let lastId = "";
    try {
      lastId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(LAST_PUBLIC_BOARD_KEY) || ""
          : "";
    } catch {
      lastId = "";
    }
    const target = list.find((b) => b.id === lastId) || list[0];
    if (target?.id) {
      router.push(
        `/board?room=${encodeURIComponent(target.id)}`,
        undefined,
        { locale: router.locale }
      );
      return;
    }
    try {
      const authorName =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AUTHOR_NAME_KEY) || ""
          : "";
      const res = await createCollabBoard({
        title: "みんなのポラロイドボード",
        visibility: "public",
        authorName,
      });
      if (res?.board?.id) {
        setThemePublicBoards((prev) => [res.board, ...prev]);
        router.push(
          `/board?room=${encodeURIComponent(res.board.id)}`,
          undefined,
          { locale: router.locale }
        );
      }
    } catch (err) {
      setRoomError(err.message || "公開ボードの作成に失敗しました");
    }
  };

  const handleSwitchToPersonalBoard = () => {
    let lastId = "default";
    try {
      lastId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem(LAST_PERSONAL_BOARD_KEY) || "default"
          : "default";
    } catch {
      lastId = "default";
    }
    if (lastId && lastId !== "default") {
      router.push(
        `/board?personal=${encodeURIComponent(lastId)}`,
        undefined,
        { locale: router.locale }
      );
      return;
    }
    router.push("/board", undefined, { locale: router.locale });
  };

  const handleCreateThemeFromTab = async (title) => {
    const trimmed = String(title || "").trim();
    if (!trimmed) return;
    if (isCollabMode) {
      const authorName =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AUTHOR_NAME_KEY) || ""
          : "";
      const res = await createCollabBoard({
        title: trimmed,
        visibility: "public",
        authorName,
      });
      if (res?.board?.id) {
        setThemePublicBoards((prev) => [res.board, ...prev]);
        router.push(
          `/board?room=${encodeURIComponent(res.board.id)}`,
          undefined,
          { locale: router.locale }
        );
      }
      return;
    }
    const board = createPersonalBoard({ title: trimmed });
    setPersonalBoardList(listPersonalBoards());
    if (board?.id) {
      router.push(
        `/board?personal=${encodeURIComponent(board.id)}`,
        undefined,
        { locale: router.locale }
      );
    }
  };

  return {
    personalMeta,
    setPersonalMeta,
    collabTitleDraft,
    setCollabTitleDraft,
    parsedCollab,
    visibleTabs,
    activeTabKey,
    handleSavePersonalTitle,
    handleSavePersonalDescription,
    handleSavePersonalRelatedHubs,
    handleSaveCollabTitle,
    handleSaveCollabDescription,
    handleSaveCollabRelatedHubs,
    handleSelectTab,
    handleCreateThemeFromTab,
    handleSwitchToPersonalBoard,
    handleSwitchToPublicBoard,
  };
}
