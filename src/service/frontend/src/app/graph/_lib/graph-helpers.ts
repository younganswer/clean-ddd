import type { GraphView } from "@/lib/api";

export type RootType = "USER" | "ORDER" | "SHIPMENT" | "PAYMENT";
export type GraphDensity = "COMPACT" | "COMFORTABLE";

export const DEFAULT_DEPTH = 2;
export const DEFAULT_MAX_EVENTS = 500;
export const DEFAULT_MAX_NODES = 600;

export function isRootType(value: string | null): value is RootType {
	return (
		value === "USER" ||
		value === "ORDER" ||
		value === "SHIPMENT" ||
		value === "PAYMENT"
	);
}

export function safeString(value: unknown): string {
	return typeof value === "string" ? value : String(value ?? "");
}

export function parseNodeKey(nodeId: string): { type: string; key: string } {
	const idx = nodeId.indexOf(":");
	if (idx < 0) return { type: nodeId, key: "" };
	return { type: nodeId.slice(0, idx), key: nodeId.slice(idx + 1) };
}

export function readCssVar(name: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;
	const value = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
	return value || fallback;
}

export function finiteOrDefault(value: number, fallback: number): number {
	return Number.isFinite(value) ? value : fallback;
}

export function graphKey(graph: GraphView): string {
	return `${graph.rootNodeId}|${graph.nodes.length}|${graph.edges.length}`;
}
