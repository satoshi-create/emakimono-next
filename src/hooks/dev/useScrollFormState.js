import { useCallback, useEffect, useMemo, useState } from "react";
import { extractYamlScalar, validateScrollYaml } from "@/lib/dev/uploadScroll/yamlValidator";

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

  const yamlScrollId = useMemo(() => extractYamlScalar(rawYaml, "scroll_id"), [rawYaml]);
  const yamlTitleen = useMemo(() => extractYamlScalar(rawYaml, "titleen"), [rawYaml]);

  useEffect(() => {
    fetch("/api/dev/scroll-templates")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((data) => {
        setScrollTemplates(Array.isArray(data.templates) ? data.templates : []);
        setExistingScrolls(Array.isArray(data.existingScrolls) ? data.existingScrolls : []);
        if (data.nextAvailableId != null) setNextAvailableId(data.nextAvailableId);
      })
      .catch(() => {});
  }, []);

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
    previewOrder,
    loadYamlFile,
    addYamlFiles,
    addFiles,
    removeImage,
    moveImage,
  };
}