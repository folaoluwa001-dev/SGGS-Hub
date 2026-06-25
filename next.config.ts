import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;