import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { AppSidebarNav } from "@/app/_components/app-sidebar-nav";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "clean-ddd Admin",
	description: "clean-ddd admin",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<div className="app-shell">
					<aside className="app-sidebar">
						<div className="border-b border-border px-4 py-4">
							<div className="text-sm font-semibold text-foreground">
								clean-ddd Admin
							</div>
							<div className="mt-1 text-xs text-muted-foreground">
								Logical structure visibility
							</div>
						</div>
						<div className="px-3 py-4">
							<AppSidebarNav />
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
						</header>

						<main className="app-main">{children}</main>
					</div>
				</div>
			</body>
		</html>
	);
}
