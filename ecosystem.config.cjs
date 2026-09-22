module.exports = {
  apps: [
    {
      name: "emakimono-next",
      // Next.js本体(JS)を直接指定（Windowsの構文エラーおよびcmd.exe経由のポップアップを回避）
      script: "./node_modules/next/dist/bin/next",
      args: "dev",
      watch: false,
      max_memory_restart: "2G",
      // Windows環境でコマンドプロンプト画面が前面にポップアップするのを抑制
      windowsHide: true,
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
    },
  ],
};