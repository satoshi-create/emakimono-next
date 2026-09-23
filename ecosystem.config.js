module.exports = {
  apps: [
    {
      name: "emakimono-next",
      script: "node_modules/.bin/next",
      args: "dev",
      watch: false,
      env: {
        NODE_ENV: "development",
        PORT: 3002,
      },
    },
  ],
};
