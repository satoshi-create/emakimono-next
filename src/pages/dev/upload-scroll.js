import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import { ui, dropZoneStyle, thumbGridStyle } from "@/components/dev/uploadScroll/uploadScrollStyles";
import { useScrollFormState } from "@/hooks/dev/useScrollFormState";
import { useScrollSlicer } from "@/hooks/dev/useScrollSlicer";
import { useScrollUploadSubmit } from "@/hooks/dev/useScrollUploadSubmit";
import { YamlConfigSection } from "@/components/dev/uploadScroll/YamlConfigSection";
import { AutoSlicePanel } from "@/components/dev/uploadScroll/AutoSlicePanel";
import { ThumbCard } from "@/components/dev/uploadScroll/ThumbCard";
import { UploadResultBanner } from "@/components/dev/uploadScroll/UploadResultBanner";

function DevUploadScrollPage() {
  const setResultLogRef = useRef(() => {});

  const {
    rawYaml,
    setRawYaml,
    yamlFileName,
    scrollTemplates,
    nextAvailableId,
    selectedTemplateId,
    setSelectedTemplateId,
    loadSelectedTemplate,
    updateTemplate,
    templateUpdating,
    addYamlFiles,
    yamlScrollId,
    yamlTitleen,
    liveValidation,
    imageItems,
    setImageItems,
    rtlPreview,
    setRtlPreview,
    previewOrder,
    addFiles,
    removeImage,
    moveImage,
  } = useScrollFormState((payload) => setResultLogRef.current(payload));

  const clearAllNumberedImages = () => {
    const count = imageItems.length;
    if (count === 0) return;
    if (!window.confirm(`連番リストの全 ${count} 枚の画像を削除しますか？`)) return;
    setImageItems((prev) => {
      prev.forEach((item) => {
        if (item?.preview) URL.revokeObjectURL(item.preview);
      });
      return [];
    });
  };

  const slicer = useScrollSlicer({ yamlScrollId, imageItems, setImageItems });
  const { setIsRtlSlice } = slicer;

  const {
    isSubmitting,
    resultLog,
    setResultLog,
    lastSuccessResult,
    urlCopyMessage,
    dismissLastSuccessResult,
    copyViewerUrl,
    submitUpload,
  } = useScrollUploadSubmit({ rawYaml, yamlScrollId, yamlTitleen, imageItems });

  setResultLogRef.current = setResultLog;

  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageDragCounterRef = useRef(0);
  const fileInputRef = useRef(null);

  const savedLocalScrollId =
    lastSuccessResult?.ok && lastSuccessResult?.mode === "local"
      ? (lastSuccessResult.scrollId || lastSuccessResult.titleen || "").trim()
      : "";
  const canPreflight = rawYaml.trim().length > 0 && !isSubmitting;
  const canFullRun =
    canPreflight && liveValidation.errors.length === 0 && !isSubmitting;
  const canR2Run =
    canFullRun ||
    (!rawYaml.trim() && Boolean(savedLocalScrollId) && !isSubmitting);
  const btnDisabled = { opacity: 0.5, cursor: "not-allowed" };

  return (
    <>
      <Head>
        <title>Dev — Scroll Upload</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={ui.page}>
        <div style={ui.container}>
          <Link href="/dev">
            <a style={ui.backLink}>← Dev ハブへ戻る</a>
          </Link>

          <header style={ui.header}>
            <h1 style={ui.h1}>絵巻一発登録（開発専用）</h1>
            <p style={ui.subtitle}>
              Step 1: scroll_config.yaml · Step 2: 連番画像 → R2 &amp; JSON 同期（development のみ）
            </p>
          </header>

          <UploadResultBanner
            lastSuccessResult={lastSuccessResult}
            onDismiss={dismissLastSuccessResult}
            onCopyUrl={copyViewerUrl}
            urlCopyMessage={urlCopyMessage}
          />

          <YamlConfigSection
            rawYaml={rawYaml}
            setRawYaml={setRawYaml}
            yamlFileName={yamlFileName}
            scrollTemplates={scrollTemplates}
            nextAvailableId={nextAvailableId}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            loadSelectedTemplate={loadSelectedTemplate}
            updateTemplate={updateTemplate}
            templateUpdating={templateUpdating}
            addYamlFiles={addYamlFiles}
            yamlScrollId={yamlScrollId}
            yamlTitleen={yamlTitleen}
            liveValidation={liveValidation}
          />

          <section style={ui.card}>
            <div style={ui.rowBetween}>
              <h2 style={ui.h2}>2. 連番画像（{String(imageItems.length).padStart(2, "0")} 枚）</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span style={{ color: "#475569", marginRight: 4 }}>進行方向:</span>
                {[
                  { dir: "rtl", label: "RTL（右→左）", isRtl: true },
                  { dir: "ltr", label: "LTR（左→右）", isRtl: false },
                ].map((opt) => {
                  const active = rtlPreview === opt.isRtl;
                  return (
                    <button
                      key={opt.dir}
                      type="button"
                      onClick={() => {
                        setRtlPreview(opt.isRtl);
                        setIsRtlSlice(opt.isRtl);
                        setRawYaml((prev) => {
                          if (!prev) return prev;
                          if (/^\s*reading_direction\s*:/m.test(prev)) {
                            return prev.replace(
                              /^(\s*reading_direction\s*:).*$/m,
                              `$1 ${opt.dir}`
                            );
                          }
                          return prev.replace(
                            /^(metadata:\s*\r?\n)/m,
                            `$1  reading_direction: ${opt.dir}\n`
                          );
                        });
                      }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: active ? "1px solid #0f172a" : "1px solid #cbd5e1",
                        background: active ? "#0f172a" : "#ffffff",
                        color: active ? "#ffffff" : "#475569",
                        fontWeight: active ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={ui.note}>
              ※既に scrolls/&#123;scroll_id&#125;/images/ に画像がある場合は、画像選択なしで YAML のみ再同期できます。
            </p>

            <AutoSlicePanel
              rtlPreview={rtlPreview}
              {...slicer}
              numberedListCount={imageItems.length}
              clearAllNumberedImages={clearAllNumberedImages}
            />

            <div style={thumbGridStyle(rtlPreview)}>
              {previewOrder.map((item) => {
                const index = imageItems.indexOf(item);
                const nn = String(index + 1).padStart(2, "0");
                return (
                  <ThumbCard
                    key={item.key}
                    nn={nn}
                    item={item}
                    index={index}
                    total={imageItems.length}
                    onMove={moveImage}
                    onRemove={removeImage}
                    rtl={rtlPreview}
                  />
                );
              })}
            </div>
          </section>

          <section style={ui.actions}>
            <button
              type="button"
              disabled={!canPreflight}
              style={{ ...ui.btnSecondary, ...(!canPreflight ? btnDisabled : {}) }}
              onClick={() => submitUpload({ dryRun: true })}
            >
              {isSubmitting ? "実行中…" : "Preflight のみ実行（高速チェック）"}
            </button>
            <button
              type="button"
              disabled={!canFullRun}
              style={{ ...ui.btnSecondary, ...(!canFullRun ? btnDisabled : {}) }}
              onClick={() => submitUpload({ mode: "local" })}
              title={
                liveValidation.errors.length
                  ? "事前チェックのエラーを解消してください"
                  : undefined
              }
            >
              {isSubmitting ? "実行中…" : "① ローカル確認用同期（R2アップロードなし）"}
            </button>
            <button
              type="button"
              disabled={!canR2Run}
              style={{ ...ui.btnPrimary, ...(!canR2Run ? btnDisabled : {}) }}
              onClick={() =>
                submitUpload({
                  mode: "r2",
                  fallbackScrollId: !rawYaml.trim() ? savedLocalScrollId : "",
                })
              }
              title={
                rawYaml.trim() && liveValidation.errors.length
                  ? "事前チェックのエラーを解消してください"
                  : !rawYaml.trim() && savedLocalScrollId
                    ? `ローカル検証済みの「${savedLocalScrollId}」をそのまま R2 へアップロードします`
                    : undefined
              }
            >
              {isSubmitting ? "実行中…" : "② Cloudflare R2 へ本番アップロード ＆ 同期"}
            </button>
          </section>

          {resultLog && (
            <section style={ui.logPanel}>
              {resultLog.error && (
                <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#dc2626" }}>
                  エラー: {resultLog.error}
                </p>
              )}
              {resultLog.ok != null && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontWeight: 600,
                    color: resultLog.ok ? "#059669" : "#d97706",
                  }}
                >
                  exitCode: {resultLog.exitCode} {resultLog.dryRun ? "(dry-run)" : ""}
                </p>
              )}
              {resultLog.titleen && resultLog.ok && (
                <p style={{ margin: "0 0 12px" }}>
                  公開ページ:{" "}
                  <Link href={`/${resultLog.titleen}`}>
                    <a style={{ color: "#2563eb", textDecoration: "underline" }}>
                      /{resultLog.titleen}
                    </a>
                  </Link>
                </p>
              )}
              {resultLog.stdout && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stdout</p>
                  <pre style={ui.pre}>{resultLog.stdout}</pre>
                </div>
              )}
              {resultLog.stderr && (
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>stderr</p>
                  <pre style={ui.preErr}>{resultLog.stderr}</pre>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

export default DevUploadScrollPage;

export async function getServerSideProps() {
  if (process.env.NODE_ENV !== "development") {
    return { notFound: true };
  }
  return { props: {} };
}