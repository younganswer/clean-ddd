import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Core } from "cytoscape";

import { apiCreateOrder, apiCreatePaymentIntent } from "@/lib/api";
import { useGraphData } from "@/app/graph/_hooks/use-graph-data";
import {
	buildGraphElements,
	buildGraphStylesheet,
	getGraphColors,
	runFcoseLayout,
} from "@/app/graph/_lib/graph-viz";
import {
	DEFAULT_DEPTH,
	DEFAULT_MAX_EVENTS,
	DEFAULT_MAX_NODES,
	finiteOrDefault,
	graphKey,
	isRootType,
	parseNodeKey,
	safeString,
	type GraphDensity,
	type RootType,
} from "@/app/graph/_lib/graph-helpers";

export function useGraphPageState() {
	const params = useSearchParams();
	const router = useRouter();

	const rootType = params.get("rootType");
	const rootId = params.get("rootId");
	const depth = Number(params.get("depth") ?? String(DEFAULT_DEPTH));
	const maxEvents = Number(
		params.get("maxEvents") ?? String(DEFAULT_MAX_EVENTS),
	);
	const maxNodes = Number(
		params.get("maxNodes") ?? String(DEFAULT_MAX_NODES),
	);
	const includeEventsParam = params.get("includeEvents");
	const includeEvents =
		includeEventsParam === null ? true : includeEventsParam === "true";

	const [formRootType, setFormRootType] = useState<RootType>(
		isRootType(rootType) ? rootType : "USER",
	);
	const [formRootId, setFormRootId] = useState(rootId ?? "");
	const [formDepth, setFormDepth] = useState(
		String(finiteOrDefault(depth, DEFAULT_DEPTH)),
	);
	const [formMaxEvents, setFormMaxEvents] = useState(
		String(finiteOrDefault(maxEvents, DEFAULT_MAX_EVENTS)),
	);
	const [formMaxNodes, setFormMaxNodes] = useState(
		String(finiteOrDefault(maxNodes, DEFAULT_MAX_NODES)),
	);
	const [formIncludeEvents, setFormIncludeEvents] = useState(includeEvents);

	const [searchText, setSearchText] = useState("");
	const [showNodeLabels, setShowNodeLabels] = useState(true);
	const [showEdgeLabels, setShowEdgeLabels] = useState(false);
	const [density, setDensity] = useState<GraphDensity>("COMFORTABLE");
	const [layoutPadding, setLayoutPadding] = useState("40");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const [selectedQuantity, setSelectedQuantity] = useState("1");
	const [creatingOrder, setCreatingOrder] = useState(false);
	const [createPaymentOutcome, setCreatePaymentOutcome] = useState<
		"SUCCEEDED" | "FAILED"
	>("SUCCEEDED");
	const [creatingPayment, setCreatingPayment] = useState(false);

	const cyRef = useRef<Core | null>(null);
	const autoLayoutKeyRef = useRef<string | null>(null);

	const {
		graph,
		loading,
		error,
		setError,
		selectedId,
		setSelectedId,
		inventoryItems,
		inventoryLoading,
		selectedSku,
		setSelectedSku,
	} = useGraphData({
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		includeEvents,
		refreshTrigger,
		onReplaceRoute: (href) => router.replace(href),
	});

	useEffect(() => {
		setFormRootType(isRootType(rootType) ? rootType : "USER");
		setFormRootId(rootId ?? "");
		setFormDepth(String(finiteOrDefault(depth, DEFAULT_DEPTH)));
		setFormMaxEvents(
			String(finiteOrDefault(maxEvents, DEFAULT_MAX_EVENTS)),
		);
		setFormMaxNodes(String(finiteOrDefault(maxNodes, DEFAULT_MAX_NODES)));
		setFormIncludeEvents(includeEvents);
	}, [rootType, rootId, depth, maxEvents, maxNodes, includeEvents]);

	const pushQuery = useCallback(
		(next: {
			rootType: RootType;
			rootId: string;
			depth: string;
			maxEvents: string;
			maxNodes: string;
			includeEvents: boolean;
		}) => {
			const rid = next.rootId.trim();
			if (!rid) return;
			const sp = new URLSearchParams();
			sp.set("rootType", next.rootType);
			sp.set("rootId", rid);
			if (next.depth.trim()) sp.set("depth", next.depth.trim());
			if (next.maxEvents.trim())
				sp.set("maxEvents", next.maxEvents.trim());
			if (next.maxNodes.trim()) sp.set("maxNodes", next.maxNodes.trim());
			sp.set("includeEvents", String(next.includeEvents));
			router.push(`/?${sp.toString()}`);
		},
		[router],
	);

	const refreshGraph = useCallback(() => {
		if (!graph) return;
		if (!isRootType(rootType) || !rootId) return;
		setRefreshTrigger((prev) => prev + 1);
	}, [graph, rootId, rootType]);

	const selectedNode = useMemo(() => {
		if (!graph || !selectedId) return null;
		return graph.nodes.find((node) => node.id === selectedId) ?? null;
	}, [graph, selectedId]);

	const selectedInventory = useMemo(() => {
		if (!selectedSku) return null;
		return inventoryItems.find((item) => item.sku === selectedSku) ?? null;
	}, [inventoryItems, selectedSku]);

	const orderQuantity = useMemo(() => {
		const parsed = Math.trunc(Number(selectedQuantity));
		if (!Number.isFinite(parsed)) return 1;
		return Math.min(999, Math.max(1, parsed));
	}, [selectedQuantity]);

	const computedOrderMoney = useMemo(() => {
		if (!selectedInventory) return null;
		return {
			currency: selectedInventory.price.currency,
			amountMinor: selectedInventory.price.amountMinor * orderQuantity,
		};
	}, [orderQuantity, selectedInventory]);

	const elements = useMemo(() => buildGraphElements(graph), [graph]);
	const graphColors = useMemo(() => getGraphColors(), []);
	const stylesheet = useMemo(
		() =>
			buildGraphStylesheet({
				rootNodeId: graph?.rootNodeId,
				density,
				showNodeLabels,
				showEdgeLabels,
				colors: graphColors,
			}),
		[
			density,
			graph?.rootNodeId,
			graphColors,
			showEdgeLabels,
			showNodeLabels,
		],
	);

	const runLayout = useCallback(
		(cy: Core) => {
			try {
				runFcoseLayout(cy, layoutPadding);
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : String(e);
				setError((prev) => prev ?? `레이아웃 실행 실패: ${message}`);
			}
		},
		[layoutPadding, setError],
	);

	const maybeAutoLayout = useCallback(() => {
		const cy = cyRef.current;
		if (!cy || !graph) return;
		const key = graphKey(graph);
		if (autoLayoutKeyRef.current === key) return;
		autoLayoutKeyRef.current = key;
		runLayout(cy);
	}, [graph, runLayout]);

	useEffect(() => {
		if (!graph) return;
		maybeAutoLayout();
	}, [graph, maybeAutoLayout]);

	useEffect(() => {
		const cy = cyRef.current;
		if (!cy || !graph) return;
		runLayout(cy);
	}, [density, graph, layoutPadding, runLayout]);

	const handleSelectAndCenter = useCallback(() => {
		const cy = cyRef.current;
		const query = searchText.trim().toLowerCase();
		if (!cy || !query || !graph) return;
		const found = graph.nodes.find((node) => {
			const id = node.id.toLowerCase();
			const label = safeString(node.label).toLowerCase();
			return id.includes(query) || label.includes(query);
		});
		if (!found) return;
		setSelectedId(found.id);
		cy.$(":selected").unselect();
		const element = cy.$id(found.id);
		element.select();
		cy.animate({ center: { eles: element }, duration: 250 });
	}, [graph, searchText, setSelectedId]);

	const handleNodeTap = useCallback(
		(nodeId: string, shiftKey: boolean) => {
			setSelectedId(nodeId);
			if (!shiftKey) return;
			const parsed = parseNodeKey(nodeId);
			if (
				parsed.type === "USER" ||
				parsed.type === "ORDER" ||
				parsed.type === "PAYMENT" ||
				parsed.type === "SHIPMENT"
			) {
				pushQuery({
					rootType: parsed.type,
					rootId: parsed.key,
					depth: formDepth,
					maxEvents: formMaxEvents,
					maxNodes: formMaxNodes,
					includeEvents: formIncludeEvents,
				});
			}
		},
		[
			formDepth,
			formIncludeEvents,
			formMaxEvents,
			formMaxNodes,
			pushQuery,
			setSelectedId,
		],
	);

	const handleCreateOrder = useCallback(async () => {
		if (!selectedNode || selectedNode.type !== "USER") return;
		setError(null);
		setCreatingOrder(true);
		try {
			const userId = parseNodeKey(selectedNode.id).key;
			if (!selectedInventory || !computedOrderMoney) {
				setError("재고를 선택해 주세요.");
				return;
			}

			const currency = computedOrderMoney.currency;
			if (currency !== "KRW" && currency !== "USD") {
				throw new Error(`지원하지 않는 통화입니다: ${currency}`);
			}

			const res = await apiCreateOrder({
				userId,
				amount: computedOrderMoney.amountMinor,
				currency,
				items: [
					{
						sku: selectedInventory.sku,
						quantity: orderQuantity,
					},
				],
			});

			pushQuery({
				rootType: "ORDER",
				rootId: res.orderId,
				depth: formDepth,
				maxEvents: formMaxEvents,
				maxNodes: formMaxNodes,
				includeEvents: formIncludeEvents,
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setCreatingOrder(false);
		}
	}, [
		computedOrderMoney,
		formDepth,
		formIncludeEvents,
		formMaxEvents,
		formMaxNodes,
		orderQuantity,
		pushQuery,
		selectedInventory,
		selectedNode,
		setError,
	]);

	const handleCreatePaymentIntent = useCallback(async () => {
		if (!selectedNode || selectedNode.type !== "ORDER") return;
		setError(null);
		setCreatingPayment(true);
		try {
			const orderIdForPayment = parseNodeKey(selectedNode.id).key;
			const res = (await apiCreatePaymentIntent(orderIdForPayment, {
				simulateOutcome: createPaymentOutcome,
			})) as { paymentId?: string };
			const paymentIdForRoot =
				typeof res?.paymentId === "string" ? res.paymentId : null;
			if (!paymentIdForRoot) {
				setError("결제 인텐트 생성에 실패했습니다.");
				return;
			}
			pushQuery({
				rootType: "PAYMENT",
				rootId: paymentIdForRoot,
				depth: formDepth,
				maxEvents: formMaxEvents,
				maxNodes: formMaxNodes,
				includeEvents: formIncludeEvents,
			});
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError(message);
		} finally {
			setCreatingPayment(false);
		}
	}, [
		createPaymentOutcome,
		formDepth,
		formIncludeEvents,
		formMaxEvents,
		formMaxNodes,
		pushQuery,
		selectedNode,
		setError,
	]);

	return {
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		formRootType,
		formRootId,
		formDepth,
		formMaxEvents,
		formMaxNodes,
		formIncludeEvents,
		searchText,
		showNodeLabels,
		showEdgeLabels,
		density,
		layoutPadding,
		selectedQuantity,
		creatingOrder,
		createPaymentOutcome,
		creatingPayment,
		graph,
		loading,
		error,
		selectedNode,
		inventoryItems,
		inventoryLoading,
		selectedSku,
		elements,
		stylesheet,
		computedOrderMoney,
		setFormRootType,
		setFormRootId,
		setFormDepth,
		setFormMaxEvents,
		setFormMaxNodes,
		setFormIncludeEvents,
		setSearchText,
		setLayoutPadding,
		setDensity,
		setShowNodeLabels,
		setShowEdgeLabels,
		setSelectedSku,
		setSelectedQuantity,
		setCreatePaymentOutcome,
		onSubmitQuery: () => {
			pushQuery({
				rootType: formRootType,
				rootId: formRootId,
				depth: formDepth,
				maxEvents: formMaxEvents,
				maxNodes: formMaxNodes,
				includeEvents: formIncludeEvents,
			});
		},
		onSelectAndCenter: handleSelectAndCenter,
		onRelayout: () => {
			const cy = cyRef.current;
			if (!cy) return;
			runLayout(cy);
		},
		onFit: () => cyRef.current?.fit(undefined, 40),
		onCyReady: (cy: Core) => {
			cyRef.current = cy;
			maybeAutoLayout();
		},
		onNodeTap: handleNodeTap,
		onRefreshGraph: refreshGraph,
		onCreateOrder: handleCreateOrder,
		onCreatePaymentIntent: handleCreatePaymentIntent,
	};
}
