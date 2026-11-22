import { dropZoneStyle } from "@/components/dev/uploadScroll/uploadScrollStyles";

export function AutoSlicePanel({
  slicePanelOpen,
  setSlicePanelOpen,
  isRawSliceDragging,
  setIsRawSliceDragging,
  rawSliceDragCounterRef,
  addRawSliceSources,
  rawSliceInputRef,
  rtlPreview = true,
  rawSliceSourceFiles,
  setRawSliceSourceFiles,
  rawSlicePreviews = [],
  rawSlicePreviewUrl,
  rawSlicePreviewRef,
  handleRawSlicePreviewPointerMove,
  setCustomDragCutIndex,
  setCustomCuts,
  sliceMode,
  setSliceMode,
  customDragCutIndex,
  addCustomCutAtRatio,
  previewIntervals,
  customCuts,
  removeCustomCutAt,
  previewBoundaryRatios,
  sliceAspectRatio,
  setSliceAspectRatio,
  sharpenPercent = 25,
  setSharpenPercent,
  sliceCount,
  setSliceCount,
  overlapPercent,
  setOverlapPercent,
  isRtlSlice,
  setIsRtlSlice,
  initCustomCutsFromCount,
  isSlicing,
  runAutoSlice,
  sliceGenMessage,
}) {
  return (
    <details
      style={{
        marginBottom: 16,
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "12px 14px",
        background: "#f8fafc",
      }}
      open={slicePanelOpen}
      onToggle={(e) => setSlicePanelOpen(e.target.open)}
    >
      <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#334155" }}>
        長尺元画像から自動スライス生成
      </summary>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          role="button"
          tabIndex={0}
          style={dropZoneStyle(isRawSliceDragging)}
          onDragEnter={(e) => {
            e.preventDefault();
            rawSliceDragCounterRef.current += 1;
            setIsRawSliceDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            rawSliceDragCounterRef.current -= 1;
            if (rawSliceDragCounterRef.current <= 0) {
              rawSliceDragCounterRef.current = 0;
              setIsRawSliceDragging(false);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            rawSliceDragCounterRef.current = 0;
            setIsRawSliceDragging(false);
            addRawSliceSources(e.dataTransfer.files);
          }}
          onClick={() => rawSliceInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") rawSliceInputRef.current?.click();
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
            長尺元画像をドロップ / クリック（複数可）
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#64748b" }}>
            選択済み: {rawSliceSourceFiles.length} ファイル
          </p>
        </div>
        <input
          ref={rawSliceInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            addRawSliceSources(e.target.files);
            e.target.value = "";
          }}
        />
        {rawSlicePreviews.length > 0 || rawSlicePreviewUrl ? (
          <div
            style={{
              overflowX: "auto",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              padding: 8,
              background: "#fff",
              display: "flex",
              flexDirection: rtlPreview ? "row-reverse" : "row",
              justifyContent: rtlPreview ? "flex-end" : "flex-start",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            {(rawSlicePreviews.length > 0
              ? rawSlicePreviews
              : [{ url: rawSlicePreviewUrl, name: "元画像 1" }]
            ).map((item, fileIdx) => (
              <div
                key={`${item.url}-${fileIdx}`}
                style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}
              >
                <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>
                  #{fileIdx + 1} {item.name || ""}
                </span>
                <div
                  ref={fileIdx === 0 ? rawSlicePreviewRef : undefined}
                  style={{ position: "relative", display: "inline-block", touchAction: "none" }}
                  onPointerMove={fileIdx === 0 ? handleRawSlicePreviewPointerMove : undefined}
                  onPointerUp={
                    fileIdx === 0
                      ? () => {
                          setCustomDragCutIndex(null);
                          setCustomCuts((prev) => [...prev].sort((a, b) => a - b));
                        }
                      : undefined
                  }
                  onPointerCancel={
                    fileIdx === 0
                      ? () => {
                          setCustomDragCutIndex(null);
                          setCustomCuts((prev) => [...prev].sort((a, b) => a - b));
                        }
                      : undefined
                  }
                  onClick={
                    fileIdx === 0
                      ? (e) => {
                          if (sliceMode !== "custom" || customDragCutIndex != null) return;
                          const el = rawSlicePreviewRef.current;
                          if (!el) return;
                          const rect = el.getBoundingClientRect();
                          if (rect.width <= 0) return;
                          addCustomCutAtRatio((e.clientX - rect.left) / rect.width);
                        }
                      : undefined
                  }
                >
                  <img
                    src={item.url}
                    alt={`長尺元画像プレビュー ${fileIdx + 1}`}
                    draggable={false}
                    style={{ height: 220, width: "auto", maxWidth: "none", display: "block" }}
                  />
                  {fileIdx === 0 &&
                    previewIntervals.map(([start, end], idx) => (
                      <span
                        key={`badge-${idx}`}
                        style={{
                          position: "absolute",
                          left: `${((start + end) / 2) * 100}%`,
                          top: 6,
                          transform: "translateX(-50%)",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: "rgba(15, 23, 42, 0.75)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          pointerEvents: "none",
                        }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    ))}
                  {fileIdx === 0 &&
                    (sliceMode === "custom"
                      ? customCuts.map((ratio, cutIndex) => (
                          <div
                            key={`handle-${cutIndex}-${ratio.toFixed(4)}`}
                            role="presentation"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              setCustomDragCutIndex(cutIndex);
                              e.currentTarget.setPointerCapture(e.pointerId);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              removeCustomCutAt(cutIndex);
                            }}
                            style={{
                              position: "absolute",
                              left: `${ratio * 100}%`,
                              top: 0,
                              bottom: 0,
                              width: 3,
                              marginLeft: -1,
                              background: "#ef4444",
                              cursor: "ew-resize",
                              boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
                            }}
                          />
                        ))
                      : previewBoundaryRatios.map((ratio) => (
                          <div
                            key={`bound-${ratio.toFixed(5)}`}
                            style={{
                              position: "absolute",
                              left: `${ratio * 100}%`,
                              top: 0,
                              bottom: 0,
                              width: 2,
                              marginLeft: -1,
                              background: "rgba(56, 189, 248, 0.85)",
                              pointerEvents: "none",
                            }}
                          />
                        )))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            ["aspect", "一定幅・比率指定"],
            ["count", "分割数指定（屏風・扇数）"],
            ["custom", "自由区切り線指定"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSliceMode(mode)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                fontWeight: sliceMode === mode ? 700 : 500,
                borderRadius: 6,
                border: sliceMode === mode ? "1px solid #0284c7" : "1px solid #cbd5e1",
                background: sliceMode === mode ? "#e0f2fe" : "#fff",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          {sliceMode === "aspect" ? (
            <label style={{ fontSize: 13, color: "#475569" }}>
              1コマ横幅比率（高さ=1）
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={sliceAspectRatio}
                onChange={(e) => setSliceAspectRatio(parseFloat(e.target.value) || 1.5)}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
              />
            </label>
          ) : null}
          {sliceMode === "count" ? (
            <label style={{ fontSize: 13, color: "#475569" }}>
              分割数（例: 屏風 6 扇）
              <input
                type="number"
                min={2}
                step={1}
                value={sliceCount}
                onChange={(e) => setSliceCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
              />
            </label>
          ) : null}
          {sliceMode === "aspect" || sliceMode === "count" ? (
            <label style={{ fontSize: 13, color: "#475569" }}>
              オーバーラップ率（0〜30%）
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={overlapPercent}
                onChange={(e) => {
                  const v = Math.min(30, Math.max(0, parseInt(e.target.value, 10) || 0));
                  setOverlapPercent(v);
                }}
                style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
              />
            </label>
          ) : null}
          <label style={{ fontSize: 13, color: "#475569" }}>
            シャープネス（0〜100%）
            <input
              type="number"
              min={0}
              max={100}
              step={5}
              value={sharpenPercent}
              onChange={(e) => {
                const v = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                if (setSharpenPercent) setSharpenPercent(v);
              }}
              style={{ display: "block", width: "100%", marginTop: 4, padding: "6px 8px" }}
            />
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "#475569",
              paddingBottom: 6,
            }}
          >
            <input
              type="checkbox"
              checked={isRtlSlice}
              onChange={(e) => setIsRtlSlice(e.target.checked)}
            />
            右端から左へスライス（_01, _02…）
          </label>
        </div>
        {sliceMode === "custom" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 13, color: "#475569" }}>
                均等分割 N
                <input
                  type="number"
                  min={2}
                  step={1}
                  value={sliceCount}
                  onChange={(e) => setSliceCount(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  style={{ display: "block", width: 72, marginTop: 4, padding: "6px 8px" }}
                />
              </label>
              <button
                type="button"
                onClick={initCustomCutsFromCount}
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                均等 N 分割から初期線を生成
              </button>
              <button
                type="button"
                onClick={() => setCustomCuts([])}
                style={{
                  padding: "6px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                全クリア
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
              プレビュー上をクリックで赤線追加 · ドラッグで微調整 · ダブルクリックで削除
            </p>
            {customCuts.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 12, color: "#475569" }}>
                {customCuts.map((ratio, cutIndex) => (
                  <li
                    key={`list-${cutIndex}-${ratio.toFixed(4)}`}
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
                  >
                    <span>区切り {cutIndex + 1}: {(ratio * 100).toFixed(2)}%</span>
                    <button
                      type="button"
                      aria-label="削除"
                      onClick={() => removeCustomCutAt(cutIndex)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            disabled={isSlicing}
            onClick={() => runAutoSlice()}
            style={{
              padding: "8px 14px",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px solid #0ea5e9",
              background: isSlicing ? "#e2e8f0" : "#0284c7",
              color: isSlicing ? "#64748b" : "#fff",
              cursor: isSlicing ? "not-allowed" : "pointer",
            }}
          >
            {isSlicing ? "スライス生成中…" : "スライスを生成して連番リストへセット"}
          </button>
          {rawSliceSourceFiles.length > 0 ? (
            <button
              type="button"
              disabled={isSlicing}
              onClick={() => setRawSliceSourceFiles([])}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                background: "#fff",
                color: "#475569",
                cursor: isSlicing ? "not-allowed" : "pointer",
              }}
            >
              元画像選択をクリア
            </button>
          ) : null}
        </div>
        {sliceGenMessage ? (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: sliceGenMessage.includes("失敗") ? "#dc2626" : "#047857",
            }}
          >
            {sliceGenMessage}
          </p>
        ) : null}
      </div>
    </details>
  );
}