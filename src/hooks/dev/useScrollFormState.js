import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractMetadataScalar,
  extractYamlScalar,
  validateScrollYaml,
} from "@/libs/dev/uploadScroll/yamlValidator";

export function useScrollFormState(setResultLog) {
  const [rawYaml, setRawYaml] = useState("");
  const [yamlFileName, setYamlFileName] = useState("");

  const [scrollTemplates, setScrollTemplates] = useState([]);
  const [existingScrolls, setExistingScrolls] = useState([]);
  const [nextAvailableId, setNextAvailableId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [existingImageCount, setExistingImageCount] = useState(0);

  const [imageItems, setImageItems] = useState([]);
  const [rtlPreview, setRtlPreview] = useState(true);
  const [templateUpdating, setTemplateUpdating] = useState(false);

  const yamlScrollId = useMemo(() => extractYamlScalar(rawYaml, "scroll_id"), [rawYaml]);
  const yamlTitleen = useMemo(() => extractMetadataScalar(rawYaml, "titleen"), [rawYaml]);

  const refreshScrollTemplates = useCallback(() => {
    return fetch("/api/dev/scroll-templates")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        setScrollTemplates(Array.isArray(data.templates) ? data.templates : []);
        setExistingScrolls(Array.isArray(data.existingScrolls) ? data.existingScrolls : []);
        if (data.nextAvailableId != null) setNextAvailableId(data.nextAvailableId);
        return data;
      });
  }, []);

  useEffect(() => {
    refreshScrollTemplates().catch(() => {});
  }, [refreshScrollTemplates]);

  useEffect(() => {
    const sid = yamlScrollId.trim();
    if (!sid || imageItems.length > 0) return;
    fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(sid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.existingImageCount === "number") {
          setExistingImageCount(data.existingImageCount);
        }
      })
      .catch(() => {});
  }, [yamlScrollId, imageItems.length]);

  const effectiveImageCount =
    imageItems.length > 0 ? imageItems.length : existingImageCount;

  const liveValidation = useMemo(
    () =>
      validateScrollYaml(rawYaml, {
        existingScrolls,
        imageCount: effectiveImageCount,
        yamlTitleen,
      }),
    [rawYaml, existingScrolls, effectiveImageCount, yamlTitleen]
  );

  const loadSelectedTemplate = useCallback(() => {
    if (!selectedTemplateId) return;
    const hit = scrollTemplates.find((t) => t.id === selectedTemplateId);
    if (hit?.yaml) {
      setRawYaml(hit.yaml);
      setYamlFileName(`scrolls/${selectedTemplateId}/scroll_config.yaml`);
      setExistingImageCount(0);
      if (selectedTemplateId !== "_template") {
        fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(selectedTemplateId)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && typeof data.existingImageCount === "number") {
              setExistingImageCount(data.existingImageCount);
            }
          })
          .catch(() => {});
      }
      return;
    }
    fetch(`/api/dev/scroll-templates?id=${encodeURIComponent(selectedTemplateId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("not found"))))
      .then((data) => {
        if (data.yaml) setRawYaml(data.yaml);
        setYamlFileName(`scrolls/${selectedTemplateId}/scroll_config.yaml`);
        if (typeof data.existingImageCount === "number") {
          setExistingImageCount(data.existingImageCount);
        }
      })
      .catch(() => setResultLog({ error: "テンプレートの読み込みに失敗しました" }));
  }, [selectedTemplateId, scrollTemplates, setResultLog]);

  const updateTemplate = useCallback(() => {
    if (!selectedTemplateId || !rawYaml.trim()) return;
    const label =
      selectedTemplateId === "_template"
        ? "scrolls/_template/scroll_config.yaml"
        : `scrolls/${selectedTemplateId}/scroll_config.yaml`;
    const ok = window.confirm(
      `テキストエリアの内容でテンプレートファイルを上書き保存します。\n\n対象: ${label}\n\nよろしいですか？`
    );
    if (!ok) return;
    setTemplateUpdating(true);
    fetch("/api/dev/scroll-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: selectedTemplateId, rawYaml }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(data.error || "保存に失敗しました");
        }
        return data;
      })
      .then(() => refreshScrollTemplates())
      .then(() => {
        setYamlFileName(label);
        setResultLog({
          ok: true,
          stdout: `テンプレートを更新しました: ${label}`,
        });
      })
      .catch((err) => {
        setResultLog({
          error: err?.message || "テンプレートの更新に失敗しました",
        });
      })
      .finally(() => setTemplateUpdating(false));
  }, [selectedTemplateId, rawYaml, refreshScrollTemplates, setResultLog]);

  // 表示方向（右→左）の反転は thumbGridStyle の flexDirection: "row-reverse" に一本化し、二重反転を防ぐ
  const previewOrder = imageItems;

  const loadYamlFile = useCallback(
    (file) => {
      if (!file) return;
      const name = (file.name || "").toLowerCase();
      if (!name.endsWith(".yaml") && !name.endsWith(".yml")) return;
      const reader = new FileReader();
      reader.onload = () => {
        setRawYaml(String(reader.result ?? ""));
        setYamlFileName(file.name);
      };
      reader.onerror = () => {
        setResultLog({ error: "YAML の読み込みに失敗しました" });
      };
      reader.readAsText(file);
    },
    [setResultLog]
  );

  const addYamlFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      const yamlFile = files.find((f) => {
        const n = (f.name || "").toLowerCase();
        return n.endsWith(".yaml") || n.endsWith(".yml");
      });
      if (yamlFile) loadYamlFile(yamlFile);
    },
    [loadYamlFile]
  );

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;
    const next = files.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageItems((prev) => [...prev, ...next]);
  }, []);

  const removeImage = (index) => {
    setImageItems((prev) => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= imageItems.length) return;
    setImageItems((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  };

  return {
    rawYaml,
    setRawYaml,
    yamlFileName,
    scrollTemplates,
    existingScrolls,
    nextAvailableId,
    selectedTemplateId,
    setSelectedTemplateId,
    existingImageCount,
    setExistingImageCount,
    imageItems,
    setImageItems,
    rtlPreview,
    setRtlPreview,
    yamlScrollId,
    yamlTitleen,
    liveValidation,
    loadSelectedTemplate,
    updateTemplate,
    templateUpdating,
    previewOrder,
    loadYamlFile,
    addYamlFiles,
    addFiles,
    removeImage,
    moveImage,
  };
}