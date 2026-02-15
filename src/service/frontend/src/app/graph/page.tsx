"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { apiCreateOrder, apiCreatePaymentIntent } from "@/lib/api";
import {
	DEFAULT_DEPTH,
	DEFAULT_MAX_EVENTS,
	DEFAULT_MAX_NODES,
	type GraphDensity,
	type RootType,
	finiteOrDefault,
	graphKey,
	isRootType,
	parseNodeKey,
	safeString,
} from "@/app/graph/_lib/graph-helpers";
import {
	buildGraphElements,
	buildGraphStylesheet,
	getGraphColors,
	runFcoseLayout,
} from "@/app/graph/_lib/graph-viz";
import { GraphQueryForm } from "@/app/graph/_components/graph-query-form";
import { GraphDetailPanel } from "@/app/graph/_components/graph-detail-panel";
import { GraphCanvas } from "@/app/graph/_components/graph-canvas";
import { useGraphData } from "@/app/graph/_hooks/use-graph-data";

import cytoscape, { type Core, type StylesheetJson } from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

export default function GraphPage() {
	return (
		<Suspense
			fallback={
				<div className="p-4 text-sm text-muted-foreground">
					그래프 로딩 중...
				</div>
			}
		>
			<GraphPageInner />
		</Suspense>
	);
}

function GraphPageInner() {
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

	const cyRef = useRef<Core | null>(null);
	const autoLayoutKeyRef = useRef<string | null>(null);

	const [selectedQuantity, setSelectedQuantity] = useState("1");
	const [creatingOrder, setCreatingOrder] = useState(false);
	const [createPaymentOutcome, setCreatePaymentOutcome] = useState<
		"SUCCEEDED" | "FAILED"
	>("SUCCEEDED");
	const [creatingPayment, setCreatingPayment] = useState(false);

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
		onReplaceRoute: router.replace,
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

	const selectedNode = useMemo(() => {
		if (!graph || !selectedId) return null;
		return graph.nodes.find((n) => n.id === selectedId) ?? null;
	}, [graph, selectedId]);

	const selectedInventory = useMemo(() => {
		if (!selectedSku) return null;
		return inventoryItems.find((i) => i.sku === selectedSku) ?? null;
	}, [inventoryItems, selectedSku]);

	const orderQuantity = useMemo(() => {
		const n = Math.trunc(Number(selectedQuantity));
		if (!Number.isFinite(n)) return 1;
		return Math.min(999, Math.max(1, n));
	}, [selectedQuantity]);

	const computedOrderMoney = useMemo(() => {
		if (!selectedInventory) return null;
		return {
			currency: selectedInventory.price.currency,
			amountMinor: selectedInventory.price.amountMinor * orderQuantity,
		};
	}, [selectedInventory, orderQuantity]);

	const pushQuery = (next: {
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
		if (next.maxEvents.trim()) sp.set("maxEvents", next.maxEvents.trim());
		if (next.maxNodes.trim()) sp.set("maxNodes", next.maxNodes.trim());
		sp.set("includeEvents", String(next.includeEvents));
		router.push(`/?${sp.toString()}`);
	};

	const refreshGraph = () => {
		if (!graph) return;
		const rt = rootType;
		const rid = rootId;
		if (!isRootType(rt) || !rid) return;
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleSubmitQuery = () => {
		pushQuery({
			rootType: formRootType,
			rootId: formRootId,
			depth: formDepth,
			maxEvents: formMaxEvents,
			maxNodes: formMaxNodes,
			includeEvents: formIncludeEvents,
		});
	};

	const handleSelectAndCenter = () => {
		const cy = cyRef.current;
		const q = searchText.trim().toLowerCase();
		if (!cy || !q || !graph) return;
		const found = graph.nodes.find((n) => {
			const id = n.id.toLowerCase();
			const label = safeString(n.label).toLowerCase();
			return id.includes(q) || label.includes(q);
		});
		if (!found) return;
		setSelectedId(found.id);
		cy.$(":selected").unselect();
		const ele = cy.$id(found.id);
		ele.select();
		cy.animate({
			center: { eles: ele },
			duration: 250,
		});
	};

	const handleCreateOrder = async () => {
		if (!selectedNode || selectedNode.type !== "USER") return;
		setError(null);
		setCreatingOrder(true);
		try {
			const userId = parseNodeKey(selectedNode.id).key;
			if (!selectedInventory || !computedOrderMoney) {
				setError("재고를 선택해 주세요.");
				return;
			}
			const res = await apiCreateOrder({
				userId,
				amount: computedOrderMoney.amountMinor,
				currency: (() => {
					const c = computedOrderMoney.currency;
					if (c === "KRW" || c === "USD") return c;
					throw new Error(`지원하지 않는 통화입니다: ${c}`);
				})(),
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
	};

	const handleCreatePaymentIntent = async () => {
		if (!selectedNode || selectedNode.type !== "ORDER") return;
		setError(null);
		setCreatingPayment(true);
		try {
			const orderId = parseNodeKey(selectedNode.id).key;
			const res = (await apiCreatePaymentIntent(orderId, {
				simulateOutcome: createPaymentOutcome,
			})) as {
				paymentId?: string;
			};
			const paymentId =
				typeof res?.paymentId === "string" ? res.paymentId : null;
			if (!paymentId) {
				setError("결제 인텐트 생성에 실패했습니다.");
				return;
			}
			pushQuery({
				rootType: "PAYMENT",
				rootId: paymentId,
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
	};

	const handleNodeTap = (nodeId: string, shiftKey: boolean) => {
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
	};

	const handleCyReady = (cy: Core) => {
		cyRef.current = cy;
		maybeAutoLayout();
	};

	const elements = useMemo(() => buildGraphElements(graph), [graph]);

	const runLayout = (cy: Core) => {
		try {
			runFcoseLayout(cy, layoutPadding);
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError((prev) => prev ?? `레이아웃 실행 실패: ${message}`);
		}
	};

	const maybeAutoLayout = () => {
		const cy = cyRef.current;
		if (!cy || !graph) return;
		const key = graphKey(graph);
		if (autoLayoutKeyRef.current === key) return;
		autoLayoutKeyRef.current = key;
		runLayout(cy);
	};

	useEffect(() => {
		if (!graph) return;
		maybeAutoLayout();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [graph?.rootNodeId, graph?.nodes.length, graph?.edges.length]);

	useEffect(() => {
		const cy = cyRef.current;
		if (!cy || !graph) return;
		runLayout(cy);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [density, layoutPadding]);

	const graphColors = useMemo(() => getGraphColors(), []);

	const stylesheet = useMemo<StylesheetJson>(
		() =>
			buildGraphStylesheet({
				rootNodeId: graph?.rootNodeId,
				density,
				showNodeLabels,
				showEdgeLabels,
				colors: graphColors,
			}),
		[
			graph?.rootNodeId,
			graphColors,
			showNodeLabels,
			showEdgeLabels,
			density,
		],
	);

	return (
		<div className="page-shell">
			<div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
				<h1 className="text-2xl font-semibold">그래프 뷰</h1>
				<div className="text-sm text-muted-foreground">
					{rootType && rootId ? (
						<span>
							루트: <span className="font-mono">{rootType}</span>{" "}
							/ <span className="font-mono">{rootId}</span>
						</span>
					) : (
						<span>루트를 선택해 주세요.</span>
					)}
				</div>
			</div>

			<GraphQueryForm
				formRootType={formRootType}
				formRootId={formRootId}
				formDepth={formDepth}
				formMaxEvents={formMaxEvents}
				formMaxNodes={formMaxNodes}
				formIncludeEvents={formIncludeEvents}
				searchText={searchText}
				onFormRootTypeChange={setFormRootType}
				onFormRootIdChange={setFormRootId}
				onFormDepthChange={setFormDepth}
				onFormMaxEventsChange={setFormMaxEvents}
				onFormMaxNodesChange={setFormMaxNodes}
				onFormIncludeEventsChange={setFormIncludeEvents}
				onSearchTextChange={setSearchText}
				onSubmit={handleSubmitQuery}
				onSelectAndCenter={handleSelectAndCenter}
			/>

			{!rootType || !rootId ? (
				<div className="surface mt-6 p-5 text-sm">
					<div className="text-foreground">
						테이블에서 객체를 클릭하시면 해당 객체 기준으로
						사용자-주문-배송-결제-이벤트 묶음 그래프를 보여드립니다.
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							className="btn h-auto py-2"
							href="/?rootType=USER&rootId=00000000-0000-0000-0000-000000000001"
						>
							예시(USER)
						</Link>
					</div>
				</div>
			) : null}

			{loading && (
				<div className="mt-4 text-sm text-muted-foreground">
					불러오는 중...
				</div>
			)}
			{error && <div className="mt-4 text-sm text-danger">{error}</div>}
			{graph?.truncated && (
				<div className="mt-4 text-sm text-amber-700">
					응답이 일부 생략되었습니다. 필요하시면 maxNodes를 늘려
					주세요.
				</div>
			)}

			{graph && (
				<div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
					<GraphCanvas
						graph={graph}
						elements={elements}
						stylesheet={stylesheet}
						layoutPadding={layoutPadding}
						density={density}
						showNodeLabels={showNodeLabels}
						showEdgeLabels={showEdgeLabels}
						onRelayout={() => {
							const cy = cyRef.current;
							if (!cy) return;
							runLayout(cy);
						}}
						onFit={() => cyRef.current?.fit(undefined, 40)}
						onLayoutPaddingChange={setLayoutPadding}
						onDensityChange={setDensity}
						onShowNodeLabelsChange={setShowNodeLabels}
						onShowEdgeLabelsChange={setShowEdgeLabels}
						onCyReady={handleCyReady}
						onNodeTap={handleNodeTap}
					/>

					<GraphDetailPanel
						selectedNode={selectedNode}
						depth={depth}
						maxEvents={maxEvents}
						maxNodes={maxNodes}
						inventoryItems={inventoryItems}
						inventoryLoading={inventoryLoading}
						selectedSku={selectedSku}
						selectedQuantity={selectedQuantity}
						computedOrderMoney={computedOrderMoney}
						creatingOrder={creatingOrder}
						createPaymentOutcome={createPaymentOutcome}
						creatingPayment={creatingPayment}
						onRefresh={refreshGraph}
						onSelectedSkuChange={setSelectedSku}
						onSelectedQuantityChange={setSelectedQuantity}
						onCreatePaymentOutcomeChange={setCreatePaymentOutcome}
						onCreateOrder={handleCreateOrder}
						onCreatePaymentIntent={handleCreatePaymentIntent}
					/>
				</div>
			)}
		</div>
	);
}
