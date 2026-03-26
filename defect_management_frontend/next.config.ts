import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: We use dynamic routes (e.g. /defects/[defectId]) and runtime API calls.
  // Static export ("output: export") requires generateStaticParams for every dynamic route,
  // which is not compatible with this app's data-driven pages.
};

export default nextConfig;
