"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
	label: string;
	href: string;
};

type NavSection = {
	title: string;
	items: NavItem[];
};

const sections: NavSection[] = [
	{
		title: "Overview",
		items: [
			{ label: "Graph", href: "/" },
			{ label: "System Concepts", href: "/system-concepts" },
		],
	},
	{
		title: "Bounded Contexts",
		items: [
			{ label: "Users", href: "/users" },
			{ label: "Orders", href: "/orders" },
			{ label: "Shipments", href: "/shipments" },
			{ label: "Inventory", href: "/inventory" },
		],
	},
];

function isActive(pathname: string, href: string) {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
	onNavigate?: () => void;
};

export function AppSidebarNav({ onNavigate }: Props) {
	const pathname = usePathname();

	return (
		<nav className="space-y-6">
			{sections.map((section) => (
				<div key={section.title} className="space-y-2">
					<div className="px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
						{section.title}
					</div>
					<div className="space-y-1">
						{section.items.map((item) => {
							const active = isActive(pathname, item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={onNavigate}
									className={
										active
											? "nav-item nav-item-active"
											: "nav-item"
									}
								>
									{item.label}
								</Link>
							);
						})}
					</div>
				</div>
			))}
		</nav>
	);
}
