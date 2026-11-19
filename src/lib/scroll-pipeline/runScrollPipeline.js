import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// === 1. 定数・コマンド構築（Pure Logic） ===

const SCROLL_UPLOAD_SCRIPT = path.join(process.cwd(), "scripts/scroll_upload.py");
const SCROLLS_DIR = path.join(process.cwd(), "scrolls");

/**
 * @param {string} scrollId
 * @returns {string}
 */
export function resolveScrollConfigPath(scrollId) {
  return path.join(SCROLLS_DIR, scrollId, "scroll_config.yaml");
}

/**
 * scrolls/{scrollId}/scroll_config.yaml の存在を確認する。
 * @param {string} scrollId
 * @returns {boolean}
 */
export function scrollConfigExists(scrollId) {
  return fs.existsSync(resolveScrollConfigPath(scrollId));
}

/**
 * python3 scripts/scroll_upload.py の引数配列を構築する。
 * @param {{ scrollId: string, args?: string[] }} options
 * @returns {string[]}
 */
export function buildScrollUploadArgv({ scrollId, args = [] }) {
  if (!scrollConfigExists(scrollId)) {
    throw new Error(
      `scroll_config.yaml not found: ${resolveScrollConfigPath(scrollId)}`
    );
  }
  return [SCROLL_UPLOAD_SCRIPT, scrollId, ...args];
}

// === 2. パイプライン実行（Process Execution） ===

/**
 * @param {{ scrollId: string, args?: string[] }} options
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number | null }>}
 */
export function executeScrollUpload({ scrollId, args = [] }) {
  const argv = buildScrollUploadArgv({ scrollId, args });
  const scriptPath = argv[0];
  const scriptArgs = argv.slice(1);

  return new Promise((resolve, reject) => {
    const child = spawn("python3", [scriptPath, ...scriptArgs], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}