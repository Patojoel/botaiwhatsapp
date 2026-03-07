import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@whiskeysockets/baileys", "jimp", "sharp", "pino"],
  output: "standalone",
};

export default nextConfig;
