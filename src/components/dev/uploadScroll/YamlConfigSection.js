import { useMemo, useRef, useState } from "react";
import { ui, dropZoneStyle } from "@/components/dev/uploadScroll/uploadScrollStyles";

export function YamlConfigSection({
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
}) {
  const [isYamlDragging, setIsYamlDragging] = useState(false);
  const yamlDragCounterRef = useRef(0);
  const yamlFileInputRef = useRef(null);

  const validationPanelStyle = useMemo(() => {
    const hasErr = liveValidation.errors.length > 0;
    return {
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 8,
      border: `1px solid ${hasErr ? "#fca5a5" : "#86efac"}`,
      background: hasErr ? "#fef2f2" : "#f0fdf4",
    };
  }, [liveValidation.errors.length, liveValidation.warnings.length]);

  return (
    <section style={ui.card}>
      <h2 style={{ ...ui.h2, marginBottom: 16 }}>1. scroll_config.yaml</h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <label style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
          テンプレートから読み込み
        </label>
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          style={{
            minWidth: 220,
            fontSize: 13,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#fff",
          }}
        >
          <option value="">— 選択 —</option>
          {scrollTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id === "_template" ? "[雛形] _template" : t.label || t.id}
              {t.id !== "_template" ? ` (${t.id})` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          style={ui.btnSecondary}
          disabled={!selectedTemplateId}
          onClick={loadSelectedTemplate}
        >
          読込
        </button>
        <button
          type="button"
          style={ui.btnSecondary}
          disabled={!selectedTemplateId || !rawYaml.trim() || templateUpdating}
          onClick={updateTemplate}
          title={
            !selectedTemplateId
              ? "テンプレートを選択してください"
              : !rawYaml.trim()
                ? "保存する YAML を入力してください"
                : undefined
          }
        >
          {templateUpdating ? "更新中…" : "テンプレートを更新"}
        </button>
        {nextAvailableId != null ? (
          <span style={ui.badge}>次の推奨空き ID: #{nextAvailableId}</span>
        ) : null}
        {liveValidation.overwriteMode ? (
          <span
            style={{
              ...ui.badge,
              background: "#dbeafe",
              color: "#1d4ed8",
            }}
          >
            既存作品の上書き更新モード
          </span>
        ) : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        style={dropZoneStyle(isYamlDragging)}
        onDragEnter={(e) => {
          e.preventDefault();
          yamlDragCounterRef.current += 1;
          setIsYamlDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          yamlDragCounterRef.current -= 1;
          if (yamlDragCounterRef.current <= 0) {
            yamlDragCounterRef.current = 0;
            setIsYamlDragging(false);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          yamlDragCounterRef.current = 0;
          setIsYamlDragging(false);
          addYamlFiles(e.dataTransfer.files);
        }}
        onClick={() => yamlFileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") yamlFileInputRef.current?.click();
        }}
      >
        <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
          scroll_config.yaml をドラッグ＆ドロップ、またはクリックで選択
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
          対応: .yaml / .yml
        </p>
      </div>
      <input
        ref={yamlFileInputRef}
        type="file"
        accept=".yaml,.yml,text/yaml"
        style={{ display: "none" }}
        onChange={(e) => {
          addYamlFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {(yamlFileName || yamlScrollId || yamlTitleen) && (
        <div style={ui.badgeRow}>
          {yamlFileName ? <span style={ui.badgeMuted}>{yamlFileName}</span> : null}
          {yamlScrollId ? (
            <span style={ui.badge}>scroll_id: {yamlScrollId}</span>
          ) : (
            <span style={ui.badgeMuted}>scroll_id: —</span>
          )}
          {yamlTitleen ? (
            <span style={ui.badge}>titleen: {yamlTitleen}</span>
          ) : (
            <span style={ui.badgeMuted}>titleen: —</span>
          )}
        </div>
      )}

      <textarea
        style={ui.yamlEditor}
        value={rawYaml}
        onChange={(e) => setRawYaml(e.target.value)}
        placeholder="# scroll_config.yaml の内容がここに表示されます（直接編集可）"
        spellCheck={false}
      />

      <div style={validationPanelStyle} aria-live="polite">
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            fontWeight: 700,
            color: liveValidation.errors.length ? "#b91c1c" : "#047857",
          }}
        >
          リアルタイム事前チェック結果 —{" "}
          {liveValidation.errors.length === 0 ? "事前チェックOK" : "要修正"}
        </p>
        {liveValidation.errors.length === 0 &&
        liveValidation.warnings.length === 0 &&
        !rawYaml.trim() ? (
          <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
            YAML を入力または読み込むと自動検査します
          </p>
        ) : null}
        {liveValidation.errors.length > 0 ? (
          <ul style={{ margin: "0 0 8px", paddingLeft: 20, color: "#dc2626", fontSize: 13 }}>
            {liveValidation.errors.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}
        {liveValidation.warnings.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: 20, color: "#ca8a04", fontSize: 13 }}>
            {liveValidation.warnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}