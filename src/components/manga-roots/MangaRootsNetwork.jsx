import styles from "@/styles/MangaRootsNetwork.module.css";
import { faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LAYOUT = {
  full: {
    W: 1160,
    yEmaki: 110,
    yTag: 255,
    yMedia: 455,
    padEmaki: 170,
    padTag: 280,
    padMedia: 95,
  },
  ego: {
    W: 720,
    yEmaki: 70,
    yTag: 170,
    yMedia: 280,
    padEmaki: 80,
    padTag: 100,
    padMedia: 50,
  },
};

function placeX(count, index, minX, maxX) {
  if (count === 1) return (minX + maxX) / 2;
  const step = (maxX - minX) / (count - 1);
  return minX + step * index;
}

function graphToFlow(graph, locale, t, variant, enlarged) {
  // 全画面時は ego でも広いレイアウトで表示する
  const L =
    variant === "ego" && enlarged ? LAYOUT.full : LAYOUT[variant] || LAYOUT.full;
  const nodes = [
    ...graph.emakiNodes.map((n, i) => ({
      id: n.id,
      type: "emaki",
      position: { x: placeX(graph.emakiNodes.length, i, L.padEmaki, L.W - L.padEmaki), y: L.yEmaki },
      data: {
        title: locale === "en" ? n.titleEn || n.titleen : n.title,
        titleen: n.titleen,
        tags: n.tags,
        locale,
      },
      draggable: false,
    })),
    ...graph.tagNodes.map((n, i) => ({
      id: n.id,
      type: "tag",
      position: { x: placeX(graph.tagNodes.length, i, L.padTag, L.W - L.padTag), y: L.yTag },
      data: { label: locale === "en" ? n.labelEn : n.labelJa, tags: [n.id] },
      draggable: false,
    })),
    ...graph.mediaNodes.map((n, i) => ({
      id: n.id,
      type: "media",
      position: { x: placeX(graph.mediaNodes.length, i, L.padMedia, L.W - L.padMedia), y: L.yMedia },
      data: {
        title: locale === "en" ? n.titleEn : n.titleJa,
        typeLabel: n.type === "anime" ? t("mangaRoots.typeAnime") : t("mangaRoots.typeManga"),
        officialUrl: n.officialUrl,
        tags: n.tags,
      },
      draggable: false,
    })),
  ];

  const edges = [
    ...graph.edges.emakiToTag.map((e, i) => ({
      id: `et-${i}`,
      source: e.from,
      target: e.via,
      data: { via: e.via },
    })),
    ...graph.edges.tagToMedia.map((e, i) => ({
      id: `tm-${i}`,
      source: e.via,
      target: e.to,
      data: { via: e.via },
    })),
  ];

  return { nodes, edges };
}

const EmakiNode = ({ data }) => (
  <div className={styles.emakiBox}>
    <Handle type="source" position={Position.Bottom} className={styles.handle} />
    <a
      href={data.locale && data.locale !== "en" ? `/${data.locale}/${data.titleen}` : `/${data.titleen}`}
      className={styles.nodeLink}
    >
      <span className={styles.emakiName}>{data.title}</span>
    </a>
  </div>
);

const MediaNode = ({ data }) => (
  <div className={styles.mediaBox}>
    <Handle type="target" position={Position.Top} className={styles.handle} />
    <a href={data.officialUrl} target="_blank" rel="noopener noreferrer" className={styles.nodeLink}>
      <span className={styles.mediaName}>{data.title}</span>
      <span className={styles.mediaType}>{data.typeLabel}</span>
    </a>
  </div>
);

const TagNode = ({ data }) => (
  <div className={styles.tagChip} role="button" tabIndex={0}>
    <Handle type="target" position={Position.Top} className={styles.handle} />
    <span className={styles.tagText}>{data.label}</span>
    <Handle type="source" position={Position.Bottom} className={styles.handle} />
  </div>
);

const nodeTypes = { emaki: EmakiNode, media: MediaNode, tag: TagNode };

const MangaRootsFlow = ({ graph, t, locale, variant = "full", focusEmakiId = null }) => {
  const [activeTag, setActiveTag] = useState(null);
  const [enlarged, setEnlarged] = useState(false);
  const wrapRef = useRef(null);
  const { fitView } = useReactFlow();
  const isEgo = variant === "ego";
  const { nodes, edges } = useMemo(
    () => graphToFlow(graph, locale, t, variant, enlarged),
    [graph, locale, t, variant, enlarged]
  );
  const focusTags = useMemo(() => {
    if (!focusEmakiId) return null;
    return graph.emakiNodes.find((n) => n.id === focusEmakiId)?.tags ?? null;
  }, [graph, focusEmakiId]);

  const fitToPane = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width < 8 || height < 8) return;
    fitView({ padding: 0.08 });
  }, [fitView]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fitToPane);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fitToPane, nodes, enlarged]);

  useEffect(() => {
    if (!enlarged) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [enlarged]);

  useEffect(() => {
    if (!enlarged) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setEnlarged(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarged]);

  const nodeClassName = useCallback(
    (node) => {
      if (activeTag) {
        const related =
          node.type === "tag" ? node.id === activeTag : node.data.tags?.includes(activeTag);
        return related ? undefined : styles.nodeDim;
      }
      if (focusTags) {
        if (node.type === "emaki") return node.id === focusEmakiId ? undefined : styles.nodeDim;
        if (node.type === "tag") return focusTags.includes(node.id) ? undefined : styles.nodeDim;
        const related = node.data.tags?.some((id) => focusTags.includes(id));
        return related ? undefined : styles.nodeDim;
      }
      return undefined;
    },
    [activeTag, focusTags, focusEmakiId]
  );

  const edgeClassName = useCallback(
    (edge) => {
      if (activeTag) {
        return edge.data?.via === activeTag ? styles.edge : `${styles.edge} ${styles.edgeDim}`;
      }
      if (focusTags) {
        return focusTags.includes(edge.data?.via)
          ? styles.edge
          : `${styles.edge} ${styles.edgeDim}`;
      }
      return styles.edge;
    },
    [activeTag, focusTags]
  );

  const onNodeClick = useCallback((_, node) => {
    if (node.type !== "tag") return;
    setActiveTag((cur) => (cur === node.id ? null : node.id));
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.stageSlot} ${isEgo ? styles.stageSlotEgo : ""}`}>
        <div
          className={`${styles.stage} ${enlarged ? styles.stageFullscreen : ""}`}
          ref={wrapRef}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodeOrigin={[0.5, 0.5]}
            fitView
            fitViewOptions={{ padding: 0.08 }}
            onInit={fitToPane}
            minZoom={0.1}
            maxZoom={2.5}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            panOnScroll={false}
            nodeClassName={nodeClassName}
            edgeClassName={edgeClassName}
            onNodeClick={onNodeClick}
            proOptions={{ hideAttribution: true }}
            aria-label={t("mangaRoots.networkAria")}
          >
            <Controls showInteractive={false} showFitView={false} position="bottom-right" />
          </ReactFlow>
          <button
            type="button"
            className={styles.zoomIcon}
            onClick={() => setEnlarged((v) => !v)}
            aria-label={
              enlarged
                ? t("mangaRoots.networkFullscreenClose")
                : t("mangaRoots.networkFullscreenOpen")
            }
            aria-expanded={enlarged}
          >
            <FontAwesomeIcon icon={enlarged ? faCompress : faExpand} />
          </button>
        </div>
      </div>
      <p className={styles.hint}>{t("mangaRoots.networkHint")}</p>
    </div>
  );
};

const MangaRootsNetwork = ({ graph, t, locale, variant = "full", focusEmakiId = null }) => (
  <ReactFlowProvider>
    <MangaRootsFlow
      graph={graph}
      t={t}
      locale={locale}
      variant={variant}
      focusEmakiId={focusEmakiId}
    />
  </ReactFlowProvider>
);

export default MangaRootsNetwork;
