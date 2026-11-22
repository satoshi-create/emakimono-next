import { useCallback, useEffect, useState } from "react";
import {
  UPLOAD_RESULT_STORAGE_KEY,
  extractYamlScalar,
} from "@/libs/dev/uploadScroll/yamlValidator";
import { extFromFile, fileToDataUrl } from "@/libs/dev/uploadScroll/sliceGeometry";

// === 1. 送信・結果ログ状態 ===
// Preflight / local / R2 実行と API 応答ログ

export function useScrollUploadSubmit({ rawYaml, yamlScrollId, yamlTitleen, imageItems }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultLog, setResultLog] = useState(null);
  const [lastSuccessResult, setLastSuccessResult] = useState(null);
  const [urlCopyMessage, setUrlCopyMessage] = useState("");

  // === 2. リロード耐性 — sessionStorage から前回成功結果を復元 ===

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UPLOAD_RESULT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.ok) setLastSuccessResult(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const dismissLastSuccessResult = useCallback(() => {
    try {
      sessionStorage.removeItem(UPLOAD_RESULT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setLastSuccessResult(null);
    setUrlCopyMessage("");
  }, []);

  const copyViewerUrl = useCallback(async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopyMessage("コピーしました");
      setTimeout(() => setUrlCopyMessage(""), 2000);
    } catch {
      setUrlCopyMessage("コピーに失敗しました");
    }
  }, []);

  // === 3. /api/dev/upload-scroll への送信（preflight / local / r2） ===

  const submitUpload = async ({
    dryRun = false,
    mode = null,
    fallbackScrollId = "",
  } = {}) => {
    const trimmed = rawYaml.trim();
    const resolvedFallbackScrollId =
      typeof fallbackScrollId === "string" ? fallbackScrollId.trim() : "";
    const useSavedLocalConfig =
      !trimmed && mode === "r2" && !dryRun && Boolean(resolvedFallbackScrollId);

    if (!trimmed && !useSavedLocalConfig) {
      setResultLog({ error: "scroll_config.yaml をアップロードまたは入力してください" });
      return;
    }

    const scrollId = trimmed ? yamlScrollId.trim() : resolvedFallbackScrollId;
    if (!scrollId) {
      setResultLog({ error: "YAML 内に scroll_id が見つかりません" });
      return;
    }

    setIsSubmitting(true);
    setResultLog(null);

    try {
      const images =
        !useSavedLocalConfig && imageItems.length > 0
          ? await Promise.all(
              imageItems.map(async (item) => ({
                base64: await fileToDataUrl(item.file),
                ext: extFromFile(item.file),
              }))
            )
          : [];

      const payload = {
        scrollId,
        rawYaml: trimmed,
        images,
        dryRun,
      };
      if (mode === "local" || mode === "r2") {
        payload.mode = mode;
      }

      const res = await fetch("/api/dev/upload-scroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setResultLog({
          error: data.error || `HTTP ${res.status}`,
          exitCode: data.exitCode,
          stderr: data.stderr,
          stdout: data.stdout,
        });
        return;
      }

      setResultLog({
        ok: data.ok,
        exitCode: data.exitCode,
        stdout: data.stdout,
        stderr: data.stderr,
        titleen: data.titleen,
        dryRun,
        mode,
      });

      if (data.ok && !dryRun && (mode === "local" || mode === "r2")) {
        const titleen =
          data.titleen || yamlTitleen.trim() || lastSuccessResult?.titleen || "";
        const title =
          data.title ||
          (trimmed ? extractYamlScalar(trimmed, "title") : "") ||
          lastSuccessResult?.title ||
          titleen;
        const viewerUrl =
          data.viewerUrl ||
          (typeof window !== "undefined" && titleen
            ? `${window.location.origin}/${titleen}`
            : titleen
              ? `/${titleen}`
              : "");
        const successPayload = {
          ok: true,
          mode,
          scrollId,
          titleen,
          title,
          viewerUrl,
          timestamp: Date.now(),
        };
        try {
          sessionStorage.setItem(UPLOAD_RESULT_STORAGE_KEY, JSON.stringify(successPayload));
        } catch {
          /* ignore */
        }
        setLastSuccessResult(successPayload);
        setUrlCopyMessage("");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } catch (err) {
      setResultLog({
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    resultLog,
    setResultLog,
    lastSuccessResult,
    urlCopyMessage,
    dismissLastSuccessResult,
    copyViewerUrl,
    submitUpload,
  };
}