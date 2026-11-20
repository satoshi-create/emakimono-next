import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const CATEGORY_STORAGE_KEY = "spot_picker_custom_categories";

const DEFAULT_CATEGORIES = [
  "temple",
  "shrine",
  "castle",
  "palace",
  "bridge",
  "river",
  "street",
  "building",
  "landmark",
  "culture",
  "town",
  "garden",
  "mountain",
  "gate",
];

function parseSliceNum(filename) {
  const base = filename.replace(/^.*[\\/]/, "");
  const m = base.match(/_(\d{1,2})[-_.]/);
  if (m) return parseInt(m[1], 10);
  const m2 = base.match(/_(\d{1,2})\./);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function escapeCsvField(s) {
  if (s == null) return '""';
  const str = String(s);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return `"${str}"`;
}

function buildCsvLine(scrollId, sliceNum, spotId, name, nameen, x, y, category) {
  const parts = [
    scrollId,
    sliceNum,
    spotId,
    escapeCsvField(name),
    escapeCsvField(nameen),
    x,
    y,
    category,
  ];
  return parts.join(",");
}

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string" && s.trim())
      : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(categories) {
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch {
    /* ignore */
  }
}

const pageStyle = {
  margin: 0,
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  background: "#1a1a1a",
  color: "#e8e8e8",
  padding: "1rem",
  minHeight: "100vh",
  boxSizing: "border-box",
};

function DevSpotPickerPage() {
  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORIES);
  const [slices, setSlices] = useState(() => new Map());
  const [currentSlice, setCurrentSlice] = useState(null);
  const [pins, setPins] = useState([]);
  const [canvasVisible, setCanvasVisible] = useState(false);
  const [scrollId, setScrollId] = useState("rakuchu-rakugai-met");
  const [spotId, setSpotId] = useState("");
  const [name, setName] = useState("");
  const [nameen, setNameen] = useState("");
  const [category, setCategory] = useState("temple");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  const previewRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const knownCategories = useMemo(
    () => new Set(categoryOptions),
    [categoryOptions]
  );

  const sliceNums = useMemo(
    () => Array.from(slices.keys()).sort((a, b) => a - b),
    [slices]
  );

  useEffect(() => {
    const custom = loadCustomCategories();
    if (custom.length) {
      setCategoryOptions((prev) => {
        const next = [...prev];
        custom.forEach((c) => {
          if (!next.includes(c)) next.push(c);
        });
        return next;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const revokeAllObjectUrls = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  }, []);

  const addCategoryOption = useCallback((value) => {
    const v = value.trim();
    if (!v || knownCategories.has(v)) return;
    setCategoryOptions((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }, [knownCategories]);

  const ensureCategoryInList = useCallback(
    (rawCategory) => {
      const v = rawCategory.trim();
      if (!v) return v;
      if (!knownCategories.has(v)) {
        addCategoryOption(v);
        const custom = loadCustomCategories();
        if (!custom.includes(v)) {
          custom.push(v);
          saveCustomCategories(custom);
        }
      }
      return v;
    },
    [knownCategories, addCategoryOption]
  );

  const selectSlice = useCallback(
    (n) => {
      const data = slices.get(n);
      if (!data) return;
      setCurrentSlice(n);
      setCanvasVisible(true);
      setPins([]);
    },
    [slices]
  );

  const onFilesChange = useCallback(
    (e) => {
      revokeAllObjectUrls();
      setPins([]);
      const nextMap = new Map();
      const fileList = Array.from(e.target.files || []);
      fileList.forEach((file) => {
        const num = parseSliceNum(file.name);
        if (num == null) return;
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        nextMap.set(num, { url, name: file.name });
      });
      setSlices(nextMap);
      const nums = Array.from(nextMap.keys()).sort((a, b) => a - b);
      if (nums.length) {
        setCurrentSlice(nums[0]);
        setCanvasVisible(true);
        setPins([]);
      } else {
        setCanvasVisible(false);
        setCurrentSlice(null);
      }
    },
    [revokeAllObjectUrls]
  );

  const onPreviewClick = useCallback(
    (e) => {
      if (currentSlice == null) return;
      const preview = previewRef.current;
      if (!preview) return;
      const rect = preview.getBoundingClientRect();
      const naturalW = preview.naturalWidth;
      const naturalH = preview.naturalHeight;
      if (!naturalW || !naturalH) return;

      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      const x = (relX * 100).toFixed(1);
      const y = (relY * 100).toFixed(1);

      setPins((prev) => [
        ...prev,
        { left: `${relX * 100}%`, top: `${relY * 100}%` },
      ]);

      const scroll = scrollId.trim();
      const spot = spotId.trim();
      const nameVal = name.trim();
      const nameenVal = nameen.trim();
      const cat = ensureCategoryInList(category);

      const line = buildCsvLine(
        scroll,
        currentSlice,
        spot,
        nameVal,
        nameenVal,
        x,
        y,
        cat
      );

      setOutput((prev) => (prev ? `${prev}\n${line}` : line));

      navigator.clipboard.writeText(line).then(
        () => {
          setStatus(`Copied: ${line}`);
        },
        () => {
          setStatus("Clipboard failed — line appended to textarea.");
        }
      );
    },
    [
      currentSlice,
      scrollId,
      spotId,
      name,
      nameen,
      category,
      ensureCategoryInList,
    ]
  );

  const currentPreviewSrc =
    currentSlice != null ? slices.get(currentSlice)?.url : undefined;

  return (
  <>
    <Head>
      <title>Spot Picker — CSV coordinate tool</title>
    </Head>
    <div style={pageStyle}>
    <nav style={{ marginBottom: "1rem" }}>
      <Link href="/dev">
        <a style={{ color: "#7cb87c", textDecoration: "underline" }}>← Dev ハブ</a>
      </Link>
    </nav>
    <h1 style={{ fontSize: "1.1rem", margin: "0 0 1rem", fontWeight: 600 }}>
      Spot Picker
    </h1>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "flex-start",
      }}
    >
      <p
        className="panel"
        style={{
          background: "#252525",
          border: "1px solid #404040",
          borderRadius: 8,
          padding: "1rem",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "0.5rem 0.75rem",
          alignItems: "center",
          minWidth: 280,
          margin: 0,
        }}
      >
        <label htmlFor="files" style={{ color: "#aaa" }}>
          Slice images (multiple)
        </label>
        <input
          type="file"
          id="files"
          multiple
          accept="image/*"
          onChange={onFilesChange}
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      </p>
    </div>
    <div
      className="panel"
      style={{
        background: "#252525",
        border: "1px solid #404040",
        borderRadius: 8,
        padding: "1rem",
        marginTop: "1rem",
      }}
    >
      <div
        className="form-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.5rem 0.75rem",
          alignItems: "center",
          minWidth: 280,
        }}
      >
        <label htmlFor="scroll_id" style={{ color: "#aaa" }}>
          scroll_id
        </label>
        <input
          type="text"
          id="scroll_id"
          value={scrollId}
          onChange={(ev) => setScrollId(ev.target.value)}
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <label htmlFor="spot_id" style={{ color: "#aaa" }}>
          spot_id
        </label>
        <input
          type="text"
          id="spot_id"
          placeholder="e.g. kiyomizu-dera"
          value={spotId}
          onChange={(ev) => setSpotId(ev.target.value)}
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <label htmlFor="name" style={{ color: "#aaa" }}>
          name
        </label>
        <input
          type="text"
          id="name"
          placeholder="日本語名"
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <label htmlFor="nameen" style={{ color: "#aaa" }}>
          nameen
        </label>
        <input
          type="text"
          id="nameen"
          placeholder="English name"
          value={nameen}
          onChange={(ev) => setNameen(ev.target.value)}
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <label htmlFor="category" style={{ color: "#aaa" }}>
          category
        </label>
        <input
          id="category"
          type="text"
          list="categoryList"
          value={category}
          onChange={(ev) => setCategory(ev.target.value)}
          placeholder="選択または新規入力"
          style={{
            background: "#111",
            border: "1px solid #555",
            color: "#eee",
            padding: "0.35rem 0.5rem",
            borderRadius: 4,
            width: "100%",
            boxSizing: "border-box",
          }}
        />
        <datalist id="categoryList">
          {categoryOptions.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </div>
      <p style={{ color: "#888", fontSize: 12, marginTop: "0.5rem" }}>
        Click on the image to set x,y (%), copy CSV line to clipboard, and append
        below.
      </p>
      <div
        id="status"
        style={{
          color: "#7cb87c",
          fontSize: 12,
          minHeight: "1.2em",
          marginTop: "0.25rem",
        }}
      >
        {status}
      </div>
      <div
        id="sliceTabs"
        className="slice-tabs"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          margin: "0.75rem 0",
        }}
      >
        {sliceNums.map((n) => (
          <button
            key={n}
            type="button"
            data-slice={String(n)}
            onClick={() => selectSlice(n)}
            style={{
              background: currentSlice === n ? "#5c3d2e" : "#333",
              border:
                currentSlice === n
                  ? "1px solid #c49a6c"
                  : "1px solid #555",
              color: currentSlice === n ? "#fff" : "#ccc",
              padding: "0.25rem 0.6rem",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            slice {n}
          </button>
        ))}
      </div>
      <div
        id="canvasWrap"
        hidden={!canvasVisible}
        className="canvas-wrap"
        style={{
          position: "relative",
          display: canvasVisible ? "inline-block" : "none",
          maxWidth: "100%",
          cursor: "crosshair",
        }}
      >
        {currentPreviewSrc ? (
          <img
            ref={previewRef}
            id="preview"
            alt="slice"
            src={currentPreviewSrc}
            onClick={onPreviewClick}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              userSelect: "none",
            }}
          />
        ) : null}
        {pins.map((pin, i) => (
          <span
            key={i}
            className="pin"
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              margin: "-7px 0 0 -7px",
              left: pin.left,
              top: pin.top,
              background: "#e53935",
              border: "2px solid #fff",
              borderRadius: "50%",
              pointerEvents: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          />
        ))}
      </div>
    </div>
    <div
      className="panel"
      style={{
        background: "#252525",
        border: "1px solid #404040",
        borderRadius: 8,
        padding: "1rem",
        marginTop: "1rem",
      }}
    >
      <label htmlFor="output" style={{ color: "#aaa" }}>
        Accumulated CSV lines
      </label>
      <textarea
        id="output"
        readOnly
        value={output}
        style={{
          width: "100%",
          minHeight: 140,
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          marginTop: "0.5rem",
          background: "#111",
          border: "1px solid #555",
          color: "#eee",
          padding: "0.35rem 0.5rem",
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      />
    </div>
    </div>
  </>
  );
}

export default DevSpotPickerPage;

export async function getServerSideProps() {
  if (process.env.NODE_ENV !== "development") {
    return { notFound: true };
  }
  return { props: {} };
}