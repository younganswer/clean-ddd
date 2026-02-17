"use client";

import { useEffect } from "react";

const normalizePath = (pathname: string): string => {
	const trimmed = pathname.replace(/\/+$/, "");
	return trimmed.length > 0 ? trimmed : "/";
};

const RootPage = () => {
	useEffect(() => {
		const currentPath = normalizePath(window.location.pathname);
		if (currentPath === "/") {
			window.location.replace(
				`/graph/index.html${window.location.search}${window.location.hash}`,
			);
			return;
		}

		if (currentPath.endsWith("/index.html")) return;

		const target = `${currentPath}/index.html${window.location.search}${window.location.hash}`;
		window.location.replace(target);
	}, []);

	return (
		<div className="page-shell">
			<div className="text-sm text-muted-foreground">페이지를 불러오는 중...</div>
		</div>
	);
};

export default RootPage;
