"use client";

import { useEffect } from "react";
import GraphPage from "@/app/graph/page";

const normalizePath = (pathname: string): string => {
	const trimmed = pathname.replace(/\/+$/, "");
	return trimmed.length > 0 ? trimmed : "/";
};

const RootPage = () => {
	useEffect(() => {
		const currentPath = normalizePath(window.location.pathname);
		if (currentPath === "/") return;

		if (currentPath.endsWith("/index.html")) return;

		const target = `${currentPath}/index.html${window.location.search}${window.location.hash}`;
		window.location.replace(target);
	}, []);

	return <GraphPage />;
};

export default RootPage;
