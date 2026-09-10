module.exports = {
    apps: [
      {
        name: "emakimono-next",
        // Next.js本体(JS)を直接指定（Windowsの構文エラー回避）
        script: "./node_modules/next/dist/bin/next",
        args: "dev",
        watch: false,
        max_memory_restart: "2G",
        env: {
          NODE_ENV: "development",
        },
      },
    ],
  };