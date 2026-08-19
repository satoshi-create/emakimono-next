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

const W = 1160;
const ROW_EMAKE = 110;
const ROW_TAG = 255;
const ROW_MEDIA = 455;

function placeX(count, index, minX, maxX) {
  if (count === 1) return (minX + maxX) / 2;
  const step = (maxX - minX) / (count - 1);
  return minX + step * index;
}

function graphToFlow(graph, locale, t) {
  const nodes = [
    ...graph.emakiNodes.map((n, i) => ({
      id: n.id,
      type: "emaki",
      position: { x: placeX(graph.emakiNodes.length, i, 170, W - 170), y: ROW_EMAKE },
      data: {
        title: locale === "en" ? n.titleEn || n.titleen : n.title,
        titleen: n.titleen,
        tags: n.tags,
      },
      draggable: false,
    })),
    ...graph.tagNodes.map((n, i) => ({
      id: n.id,
      type: "tag",
      position: { x: placeX(graph.tagNodes.length, i, 280, W - 280), y: ROW_TAG },
      data: { label: locale === "en" ? n.labelEn : n.labelJa, tags: [n.id] },
      draggable: false,
    })),
    ...graph.mediaNodes.map((n, i) => ({
      id: n.id,
      type: "media",
      position: { x: placeX(graph.mediaNodes.length, i, 95, W - 95), y: ROW_MEDIA },
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
    <a href={`/${data.titleen}`} className={styles.nodeLink}>
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

const MangaRootsFlow = ({ graph, t, locale }) => {
  const [activeTag, setActiveTag] = useState(null);
  const [enlarged, setEnlarged] = useState(false);
  const wrapRef = useRef(null);
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => graphToFlow(graph, locale, t), [graph, locale, t]);

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
      if (!activeTag) return undefined;
      const related =
        node.type === "tag" ? node.id === activeTag : node.data.tags?.includes(activeTag);
      return related ? undefined : styles.nodeDim;
    },
    [activeTag]
  );

  const edgeClassName = useCallback(
    (edge) => {
      if (!activeTag) return styles.edge;
      return edge.data?.via === activeTag ? styles.edge : `${styles.edge} ${styles.edgeDim}`;
    },
    [activeTag]
  );

  const onNodeClick = useCallback((_, node) => {
    if (node.type !== "tag") return;
    setActiveTag((cur) => (cur === node.id ? null : node.id));
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.stageSlot}>
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
              enlarged ? t("mangaRoots.networkFullscreenClose") : t("mangaRoots.networkFullscreenOpen")
            }
            aria-expanded={enlarged}
          >
            <FontAwesomeIcon icon={enlarged ? faCompress : faExpand} />
          </button>
        </div>
      </div>
      <p className={styles.hint}>
        {locale === "en"
          ? "Tap a keyword to trace connections."
          : "キーワードをタップするとつながりを辿れます。"}
      </p>
    </div>
  );
};

const MangaRootsNetwork = ({ graph, t, locale }) => (
  <ReactFlowProvider>
    <MangaRootsFlow graph={graph} t={t} locale={locale} />
  </ReactFlowProvider>
);

export default MangaRootsNetwork;
