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

  const slicer = useScrollSlicer({ yamlScrollId, imageItems, setImageItems });

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

  const canPreflight = rawYaml.trim().length > 0 && !isSubmitting;
  const canFullRun =
    canPreflight && liveValidation.errors.length === 0 && !isSubmitting;
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
            addYamlFiles={addYamlFiles}
            yamlScrollId={yamlScrollId}
            yamlTitleen={yamlTitleen}
            liveValidation={liveValidation}
          />

          <section style={ui.card}>
            <div style={ui.rowBetween}>
              <h2 style={ui.h2}>2. 連番画像（{String(imageItems.length).padStart(2, "0")} 枚）</h2>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={rtlPreview}
                  onChange={(e) => setRtlPreview(e.target.checked)}
                />
                RTL プレビュー（右→左）
              </label>
            </div>
            <p style={ui.note}>
              ※既に scrolls/&#123;scroll_id&#125;/images/ に画像がある場合は、画像選択なしで YAML のみ再同期できます。
            </p>

            <AutoSlicePanel {...slicer} />

            <div
              role="button"
              tabIndex={0}
              style={dropZoneStyle(isImageDragging)}
              onDragEnter={(e) => {
                e.preventDefault();
                imageDragCounterRef.current += 1;
                setIsImageDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                imageDragCounterRef.current -= 1;
                if (imageDragCounterRef.current <= 0) {
                  imageDragCounterRef.current = 0;
                  setIsImageDragging(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                imageDragCounterRef.current = 0;
                setIsImageDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
                ドラッグ＆ドロップ、またはクリックで画像を追加
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                複数選択可 · 保存順が連番 01, 02, … になります
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
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
              disabled={!canFullRun}
              style={{ ...ui.btnPrimary, ...(!canFullRun ? btnDisabled : {}) }}
              onClick={() => submitUpload({ mode: "r2" })}
              title={
                liveValidation.errors.length
                  ? "事前チェックのエラーを解消してください"
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