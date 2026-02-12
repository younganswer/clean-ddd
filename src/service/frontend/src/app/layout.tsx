import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
				<div className="min-h-screen bg-zinc-50 text-zinc-900">
					<header className="border-b bg-white">
						<div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
							<Link href="/" className="text-lg font-semibold">
								clean-ddd Admin
							</Link>
							<nav className="flex gap-4 text-sm">
								<Link className="hover:underline" href="/users">
									사용자
								</Link>
								<Link
									className="hover:underline"
									href="/orders"
								>
									주문
								</Link>
								<Link
									className="hover:underline"
									href="/shipments"
								>
									배송
								</Link>
								<Link className="hover:underline" href="/graph">
									그래프
								</Link>
								<Link
									className="hover:underline"
									href="/inventory"
								>
									재고
								</Link>
							</nav>
						</div>
					</header>

					<main className="mx-auto max-w-5xl px-6 py-8">
						{children}
					</main>
				</div>
			</body>
		</html>
	);
}
