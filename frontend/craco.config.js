// craco.config.js
const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "components": path.resolve(__dirname, "src/components"),
      "ui": path.resolve(__dirname, "src/components/shad-ui"),
      "shad-ui": path.resolve(__dirname, "src/components/shad-ui"),
      "lib": path.resolve(__dirname, "src/lib")   // <-- alias per /src/lib
    },
  },
};
