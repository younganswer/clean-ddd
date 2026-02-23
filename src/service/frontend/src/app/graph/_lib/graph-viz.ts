import type { GraphView } from "@/lib/api";
import type {
	Core,
	BaseLayoutOptions,
	ElementDefinition,
	LayoutOptions,
	StylesheetJson,
} from "cytoscape";

import {
	type GraphDensity,
	parseNodeKey,
	readCssVar,
	safeString,
} from "@/app/graph/_lib/graph-helpers";

type FcoseLayoutOptions = BaseLayoutOptions & {
	name: "fcose";
	fit?: boolean;
	padding?: number;
};

type GraphColors = {
	nodeBg: string;
	nodeBorder: string;
	nodeText: string;
	userBorder: string;
	userBg: string;
	orderBorder: string;
	orderBg: string;
	paymentBorder: string;
	paymentBg: string;
	shipmentBorder: string;
	shipmentBg: string;
	eventBorder: string;
	eventBg: string;
	rootBorder: string;
	selectedBorder: string;
	edge: string;
	edgeText: string;
};

export const buildGraphElements = (
	graph: GraphView | null,
): ElementDefinition[] => {
	if (!graph) return [];
	const elements: ElementDefinition[] = [];

	for (const node of graph.nodes) {
		const key = parseNodeKey(node.id);
		const label = `${node.type}\n${safeString(node.label)}`;
		elements.push({
			data: {
				id: node.id,
				label,
				type: node.type,
				key: key.key,
				rawLabel: node.label,
				data: node.data ?? {},
			},
		});
	}

	for (const edge of graph.edges) {
		elements.push({
			data: {
				id: edge.id,
				source: edge.from,
				target: edge.to,
				label: edge.label ?? edge.type,
				type: edge.type,
			},
		});
	}

	return elements;
};

export const getGraphColors = (): GraphColors => {
	return {
		nodeBg: readCssVar("--graph-node-bg", "#ffffff"),
		nodeBorder: readCssVar("--graph-node-border", "#d4d4d8"),
		nodeText: readCssVar("--graph-node-text", "#18181b"),
		userBorder: readCssVar("--graph-user-border", "#38bdf8"),
		userBg: readCssVar("--graph-user-bg", "#f0f9ff"),
		orderBorder: readCssVar("--graph-order-border", "#34d399"),
		orderBg: readCssVar("--graph-order-bg", "#ecfdf5"),
		paymentBorder: readCssVar("--graph-payment-border", "#c4b5fd"),
		paymentBg: readCssVar("--graph-payment-bg", "#f5f3ff"),
		shipmentBorder: readCssVar("--graph-shipment-border", "#fdba74"),
		shipmentBg: readCssVar("--graph-shipment-bg", "#fff7ed"),
		eventBorder: readCssVar("--graph-event-border", "#a1a1aa"),
		eventBg: readCssVar("--graph-event-bg", "#fafafa"),
		rootBorder: readCssVar("--graph-root-border", "#0ea5e9"),
		selectedBorder: readCssVar("--graph-selected-border", "#0284c7"),
		edge: readCssVar("--graph-edge", "#a1a1aa"),
		edgeText: readCssVar("--graph-edge-text", "#71717a"),
	};
};

export const buildGraphStylesheet = (input: {
	rootNodeId?: string;
	density: GraphDensity;
	showNodeLabels: boolean;
	showEdgeLabels: boolean;
	colors: GraphColors;
}): StylesheetJson => {
	const { rootNodeId, density, showNodeLabels, showEdgeLabels, colors } =
		input;

	return [
		{
			selector: "node",
			style: {
				shape: "round-rectangle",
				"background-color": colors.nodeBg,
				"border-width": 1,
				"border-color": colors.nodeBorder,
				label: showNodeLabels ? "data(label)" : "",
				"font-size": density === "COMPACT" ? 9 : 10,
				"text-wrap": "wrap",
				"text-max-width": density === "COMPACT" ? "140px" : "180px",
				"text-valign": "center",
				"text-halign": "center",
				padding: density === "COMPACT" ? "6px" : "8px",
				width: density === "COMPACT" ? 164 : 200,
				height: density === "COMPACT" ? 46 : 54,
				color: colors.nodeText,
			},
		},
		{
			selector: 'node[type = "USER"]',
			style: {
				"border-color": colors.userBorder,
				"background-color": colors.userBg,
			},
		},
		{
			selector: 'node[type = "ORDER"]',
			style: {
				"border-color": colors.orderBorder,
				"background-color": colors.orderBg,
			},
		},
		{
			selector: 'node[type = "PAYMENT"]',
			style: {
				"border-color": colors.paymentBorder,
				"background-color": colors.paymentBg,
			},
		},
		{
			selector: 'node[type = "SHIPMENT"]',
			style: {
				"border-color": colors.shipmentBorder,
				"background-color": colors.shipmentBg,
			},
		},
		{
			selector: 'node[type = "EVENT"]',
			style: {
				"border-color": colors.eventBorder,
				"background-color": colors.eventBg,
			},
		},
		{
			selector: `node[id = "${rootNodeId ?? ""}"]`,
			style: {
				"border-width": 2,
				"border-color": colors.rootBorder,
			},
		},
		{
			selector: "edge",
			style: {
				"curve-style": "bezier",
				"line-color": colors.edge,
				"target-arrow-shape": "triangle",
				"target-arrow-color": colors.edge,
				"arrow-scale": 0.8,
				width: 1,
				label: showEdgeLabels ? "data(label)" : "",
				"font-size": 9,
				"text-rotation": "autorotate",
				"text-margin-y": showEdgeLabels ? -6 : 0,
				color: colors.edgeText,
			},
		},
		{
			selector: "node:selected",
			style: {
				"border-width": 3,
				"border-color": colors.selectedBorder,
			},
		},
	];
};

export const runFcoseLayout = (cy: Core, layoutPadding: string): void => {
	const paddingParsed = Math.trunc(Number(layoutPadding));
	const padding = Number.isFinite(paddingParsed)
		? Math.min(120, Math.max(10, paddingParsed))
		: 40;

	const options: FcoseLayoutOptions = {
		name: "fcose",
		fit: true,
		padding,
	};
	cy.layout(options as unknown as LayoutOptions).run();
};
