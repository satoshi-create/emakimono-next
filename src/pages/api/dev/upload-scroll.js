import fs from "fs";
import path from "path";

import { executeScrollUpload } from "@/libs/scroll-pipeline/runScrollPipeline";
import {
  buildScrollConfigYaml,
  extractScrollIdFromRawYaml,
  extractTitleenFromRawYaml,
  readScrollConfigForLocal,
} from "@/libs/dev/uploadScrollApi/yamlCodec";
import { executeLocalVerification } from "@/libs/dev/uploadScrollApi/localVerification";

export const config = {
  api: { bodyParser: { sizeLimit: "100mb" } },
};

// === 1. 定数・バリデーション ===

const SCROLL_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DATA_URL_BASE64_RE = /^data:image\/[^;]+;base64,/;

function validateScrollId(scrollId) {
  if (typeof scrollId !== "string" || !SCROLL_ID_RE.test(scrollId)) {
    return "Invalid scrollId";
  }
  return null;
}

function validateImages(images) {
  if (!Array.isArray(images) || images.length < 1) {
    return "images must be a non-empty array";
  }
  for (const item of images) {
    if (!item || typeof item.base64 !== "string" || !item.base64) {
      return "Each image requires base64";
    }
    if (item.ext != null && typeof item.ext !== "string") {
      return "image ext must be a string";
    }
  }
  return null;
}

function normalizeImageExt(ext, base64) {
  if (typeof ext === "string" && ext.trim()) {
    return ext.replace(/^\./, "").toLowerCase();
  }
  const m = base64.match(/^data:image\/([^;]+);base64,/);
  if (m) {
    const subtype = m[1].toLowerCase();
    if (subtype === "jpeg") return "jpg";
    return subtype;
  }
  return "jpg";
}

function decodeImageBase64(base64) {
  const stripped = base64.replace(DATA_URL_BASE64_RE, "");
  return Buffer.from(stripped, "base64");
}

function validateImagesIfPresent(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }
  return validateImages(images);
}

// === 2. ファイル書き出し・パイプライン実行 ===

function writeAuthoringFiles(scrollId, metadata, scenes, images) {
  const scrollDir = path.join(process.cwd(), "scrolls", scrollId);
  const imagesDir = path.join(scrollDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  images.forEach((item, index) => {
    const nn = String(index + 1).padStart(2, "0");
    const ext = normalizeImageExt(item.ext, item.base64);
    const filename = `${scrollId}_${nn}-1080.${ext}`;
    const filePath = path.join(imagesDir, filename);
    fs.writeFileSync(filePath, decodeImageBase64(item.base64));
  });

  const yaml = buildScrollConfigYaml(scrollId, metadata, scenes);
  const configPath = path.join(scrollDir, "scroll_config.yaml");
  fs.writeFileSync(configPath, yaml, "utf8");
}

function writeRawYamlAuthoringFiles(scrollId, rawYaml, images) {
  const scrollDir = path.join(process.cwd(), "scrolls", scrollId);
  const imagesDir = path.join(scrollDir, "images");
  fs.mkdirSync(imagesDir, { recursive: true });

  if (Array.isArray(images) && images.length >= 1) {
    images.forEach((item, index) => {
      const nn = String(index + 1).padStart(2, "0");
      const filename = `${scrollId}_${nn}-1080.jpg`;
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, decodeImageBase64(item.base64));
    });
  }

  const configPath = path.join(scrollDir, "scroll_config.yaml");
  fs.writeFileSync(configPath, rawYaml, "utf8");
}

function resolveUploadMode(mode) {
  return mode === "local" ? "local" : "r2";
}

function buildPipelineArgs(dryRun, uploadMode) {
  if (dryRun === true) {
    return ["--dry-run", "--ack-no-color-correction"];
  }
  const args = ["--storage", "r2", "--ack-no-color-correction", "--skip-build"];
  if (uploadMode === "local") {
    args.push("--skip-upload");
  }
  return args;
}

async function runPipelineWithPreflight(scrollId, dryRun, preflightOnly, uploadMode) {
  const preflightRes = await executeScrollUpload({
    scrollId,
    args: ["--preflight-only"],
  });

  if (preflightRes.exitCode !== 0) {
    return { kind: "preflight_failed", preflightRes };
  }

  if (preflightOnly === true) {
    return { kind: "preflight_only_ok", preflightRes };
  }

  const prodRes = await executeScrollUpload({
    scrollId,
    args: buildPipelineArgs(dryRun, uploadMode),
  });

  const stdout = [preflightRes.stdout, prodRes.stdout]
    .filter((s) => s != null && s !== "")
    .join("\n");
  const stderr = [preflightRes.stderr, prodRes.stderr]
    .filter((s) => s != null && s !== "")
    .join("\n");

  return { kind: "full", exitCode: prodRes.exitCode, stdout, stderr };
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    scrollId: bodyScrollId,
    metadata,
    scenes,
    panels: bodyPanels,
    images,
    dryRun,
    rawYaml,
    preflightOnly,
    mode: bodyMode,
  } = req.body ?? {};

  const uploadMode = resolveUploadMode(bodyMode);

  const hasRawYaml =
    typeof rawYaml === "string" && rawYaml.trim().length > 0;
  const trimmedBodyScrollId =
    typeof bodyScrollId === "string" ? bodyScrollId.trim() : "";
  const existingConfigPath =
    !hasRawYaml &&
    trimmedBodyScrollId &&
    !validateScrollId(trimmedBodyScrollId)
      ? path.join(
          process.cwd(),
          "scrolls",
          trimmedBodyScrollId,
          "scroll_config.yaml"
        )
      : "";
  const hasExistingLocalConfig = Boolean(
    existingConfigPath && fs.existsSync(existingConfigPath)
  );

  if (hasRawYaml || hasExistingLocalConfig) {
    let scrollId = trimmedBodyScrollId;
    if (hasRawYaml && validateScrollId(scrollId)) {
      scrollId = extractScrollIdFromRawYaml(rawYaml) ?? "";
    }
    const scrollErr = validateScrollId(scrollId);
    if (scrollErr) {
      return res.status(400).json({ error: scrollErr });
    }

    const imagesErr = validateImagesIfPresent(images);
    if (imagesErr) {
      return res.status(400).json({ error: imagesErr });
    }

    try {
      const effectiveRawYaml = hasRawYaml
        ? rawYaml
        : fs.readFileSync(existingConfigPath, "utf8");
      if (hasRawYaml) {
        writeRawYamlAuthoringFiles(scrollId, rawYaml, images);
      }

      const titleen = extractTitleenFromRawYaml(effectiveRawYaml) ?? scrollId;
      const parsedYaml = readScrollConfigForLocal(scrollId);
      const rawMeta =
        parsedYaml?.metadata && typeof parsedYaml.metadata === "object"
          ? parsedYaml.metadata
          : parsedYaml;
      const yamlScenes = Array.isArray(parsedYaml.scenes) ? parsedYaml.scenes : [];
      const yamlPanels = Array.isArray(parsedYaml.panels) ? parsedYaml.panels : [];

      if (uploadMode === "local") {
        if (preflightOnly === true) {
          const imagesDir = path.join(
            process.cwd(),
            "scrolls",
            scrollId,
            "images"
          );
          const hasImages =
            fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0;
          return res.status(hasImages ? 200 : 422).json({
            ok: hasImages,
            phase: "preflight",
            scrollId,
            titleen,
            mode: "local",
            viewerUrl: `/${titleen}`,
          });
        }
        const stdout = executeLocalVerification(
          scrollId,
          titleen,
          { ...rawMeta, titleen },
          yamlScenes,
          yamlPanels
        );
        return res.status(200).json({
          ok: true,
          mode: "local",
          titleen,
          title: rawMeta.title || titleen,
          viewerUrl: `/${titleen}`,
          stdout,
          scrollId,
        });
      }

      const pipeline = await runPipelineWithPreflight(
        scrollId,
        dryRun,
        preflightOnly,
        uploadMode
      );

      if (pipeline.kind === "preflight_failed") {
        const { preflightRes } = pipeline;
        return res.status(422).json({
          ok: false,
          phase: "preflight",
          exitCode: preflightRes.exitCode,
          stdout: preflightRes.stdout,
          stderr: preflightRes.stderr,
          scrollId,
          titleen,
          mode: uploadMode,
          viewerUrl: `/${titleen}`,
        });
      }

      if (pipeline.kind === "preflight_only_ok") {
        const { preflightRes } = pipeline;
        return res.status(200).json({
          ok: true,
          phase: "preflight",
          exitCode: 0,
          stdout: preflightRes.stdout,
          stderr: preflightRes.stderr,
          scrollId,
          titleen,
          mode: uploadMode,
          viewerUrl: `/${titleen}`,
        });
      }

      let stdout = pipeline.stdout;
      if (
        uploadMode === "r2" &&
        dryRun !== true &&
        preflightOnly !== true &&
        pipeline.exitCode === 0
      ) {
        if (ensureR2CanaryTitle(titleen)) {
          const line = `[R2 Canary] Registered "${titleen}"`;
          stdout = stdout ? `${stdout}\n${line}` : line;
        }
      }

      return res.status(200).json({
        ok: pipeline.exitCode === 0,
        exitCode: pipeline.exitCode,
        stdout,
        stderr: pipeline.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ error: message });
    }
  }

  const scrollId = bodyScrollId;
  const scrollErr = validateScrollId(scrollId);
  if (scrollErr) {
    return res.status(400).json({ error: scrollErr });
  }

  const imagesErr = validateImages(images);
  if (imagesErr) {
    return res.status(400).json({ error: imagesErr });
  }

  if (metadata == null || typeof metadata !== "object") {
    return res.status(400).json({ error: "metadata is required" });
  }

  try {
    writeAuthoringFiles(scrollId, metadata, scenes, images);

    const titleen =
      typeof metadata.titleen === "string" && metadata.titleen
        ? metadata.titleen
        : scrollId;
    const sceneList = Array.isArray(scenes) ? scenes : [];
    const panelList = Array.isArray(bodyPanels) ? bodyPanels : [];

    if (uploadMode === "local") {
      if (preflightOnly === true) {
        const imagesDir = path.join(process.cwd(), "scrolls", scrollId, "images");
        const hasImages =
          fs.existsSync(imagesDir) && fs.readdirSync(imagesDir).length > 0;
        return res.status(hasImages ? 200 : 422).json({
          ok: hasImages,
          phase: "preflight",
          scrollId,
          titleen,
          mode: "local",
          viewerUrl: `/${titleen}`,
        });
      }
      const stdout = executeLocalVerification(
        scrollId,
        titleen,
        { ...metadata, titleen },
        sceneList,
        panelList
      );
      return res.status(200).json({
        ok: true,
        mode: "local",
        titleen,
        title: metadata.title || titleen,
        viewerUrl: `/${titleen}`,
        stdout,
        scrollId,
      });
    }

    const pipeline = await runPipelineWithPreflight(
      scrollId,
      dryRun,
      preflightOnly,
      uploadMode
    );

    if (pipeline.kind === "preflight_failed") {
      const { preflightRes } = pipeline;
      return res.status(422).json({
        ok: false,
        phase: "preflight",
        exitCode: preflightRes.exitCode,
        stdout: preflightRes.stdout,
        stderr: preflightRes.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    }

    if (pipeline.kind === "preflight_only_ok") {
      const { preflightRes } = pipeline;
      return res.status(200).json({
        ok: true,
        phase: "preflight",
        exitCode: 0,
        stdout: preflightRes.stdout,
        stderr: preflightRes.stderr,
        scrollId,
        titleen,
        mode: uploadMode,
        viewerUrl: `/${titleen}`,
      });
    }

    let stdout = pipeline.stdout;
    if (
      uploadMode === "r2" &&
      dryRun !== true &&
      preflightOnly !== true &&
      pipeline.exitCode === 0
    ) {
      if (ensureR2CanaryTitle(titleen)) {
        const line = `[R2 Canary] Registered "${titleen}"`;
        stdout = stdout ? `${stdout}\n${line}` : line;
      }
    }

    return res.status(200).json({
      ok: pipeline.exitCode === 0,
      exitCode: pipeline.exitCode,
      stdout,
      stderr: pipeline.stderr,
      scrollId,
      titleen,
      mode: uploadMode,
      viewerUrl: `/${titleen}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
