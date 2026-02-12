import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "node:path";

const baseConfig: NextConfig = {
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
	turbopack: {
		root: path.resolve(__dirname, "..", ".."),
	},
};

export default function nextConfig(phase: string): NextConfig {
	const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

	if (phase === PHASE_DEVELOPMENT_SERVER) {
		return {
			...baseConfig,
			async rewrites() {
				if (!apiProxyTarget) return [];
				return [
					{
						source: "/api/:path*",
						destination: `${apiProxyTarget}/api/:path*`,
					},
				];
			},
		};
	}

	return {
		...baseConfig,
		output: "export",
	};
}
