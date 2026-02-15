"use client";

import { useState } from "react";
import { AppSidebarNav } from "@/app/_components/app-sidebar-nav";

type Props = {
	children: React.ReactNode;
};

export function AppShell({ children }: Props) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="app-shell">
			{sidebarOpen && (
				<button
					type="button"
					className="app-overlay"
					onClick={() => setSidebarOpen(false)}
					aria-label="메뉴 닫기"
				/>
			)}

			<aside
				id="app-sidebar"
				className={
					sidebarOpen ? "app-sidebar app-sidebar-open" : "app-sidebar"
				}
			>
				<div className="border-b border-border px-4 py-4">
					<div className="text-sm font-semibold text-foreground">
						clean-ddd Admin
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						Logical structure visibility
					</div>
				</div>
				<div className="px-3 py-4">
					<AppSidebarNav onNavigate={() => setSidebarOpen(false)} />
				</div>
			</aside>

			<div className="app-content">
				<header className="app-topbar">
					<div>
						<div className="text-sm font-medium text-foreground">
							Service UI
						</div>
						<div className="text-xs text-muted-foreground">
							Clean Architecture + DDD
						</div>
					</div>
					<button
						type="button"
						className="btn app-menu-btn h-9 w-9 items-center justify-center px-0"
						onClick={() => setSidebarOpen((prev) => !prev)}
						aria-expanded={sidebarOpen}
						aria-controls="app-sidebar"
						aria-label="메뉴 열기"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-5 w-5"
							aria-hidden="true"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</header>

				<main className="app-main">{children}</main>
			</div>
		</div>
	);
}
