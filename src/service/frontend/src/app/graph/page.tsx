"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
	apiCreateOrder,
	apiCreatePaymentIntent,
	apiGetGraph,
	apiListInventoryItems,
	apiListUsers,
	type InventoryItem,
	type GraphView,
} from "@/lib/api";

import CytoscapeComponent from "react-cytoscapejs";
import cytoscape, {
	type Core,
	type BaseLayoutOptions,
	type ElementDefinition,
	type EventObject,
	type LayoutOptions,
	type StylesheetJson,
} from "cytoscape";
import fcose from "cytoscape-fcose";

type RootType = "USER" | "ORDER" | "SHIPMENT" | "PAYMENT";
type GraphDensity = "COMPACT" | "COMFORTABLE";

type FcoseLayoutOptions = BaseLayoutOptions & {
	name: "fcose";
	fit?: boolean;
	padding?: number;
};

cytoscape.use(fcose);

function isRootType(value: string | null): value is RootType {
	return (
		value === "USER" ||
		value === "ORDER" ||
		value === "SHIPMENT" ||
		value === "PAYMENT"
	);
}

function safeString(value: unknown): string {
	return typeof value === "string" ? value : String(value ?? "");
}

function parseNodeKey(nodeId: string): { type: string; key: string } {
	const idx = nodeId.indexOf(":");
	if (idx < 0) return { type: nodeId, key: "" };
	return { type: nodeId.slice(0, idx), key: nodeId.slice(idx + 1) };
}

function readCssVar(name: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;
	const value = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
	return value || fallback;
}

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

	const depth = Number(params.get("depth") ?? "2");
	const maxEvents = Number(params.get("maxEvents") ?? "500");
	const maxNodes = Number(params.get("maxNodes") ?? "600");
	const includeEventsParam = params.get("includeEvents");
	const includeEvents =
		includeEventsParam === null ? true : includeEventsParam === "true";

	const [graph, setGraph] = useState<GraphView | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const cyRef = useRef<Core | null>(null);
	const autoSelectedRef = useRef(false);
	const autoLayoutKeyRef = useRef<string | null>(null);

	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
	const [inventoryLoading, setInventoryLoading] = useState(false);
	const [selectedSku, setSelectedSku] = useState<string>("");
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
		String(Number.isFinite(depth) ? depth : 2),
	);
	const [formMaxEvents, setFormMaxEvents] = useState(
		String(Number.isFinite(maxEvents) ? maxEvents : 500),
	);
	const [formMaxNodes, setFormMaxNodes] = useState(
		String(Number.isFinite(maxNodes) ? maxNodes : 600),
	);
	const [formIncludeEvents, setFormIncludeEvents] = useState(includeEvents);
	const [searchText, setSearchText] = useState("");
	const [showNodeLabels, setShowNodeLabels] = useState(true);
	const [showEdgeLabels, setShowEdgeLabels] = useState(false);
	const [density, setDensity] = useState<GraphDensity>("COMFORTABLE");
	const [layoutPadding, setLayoutPadding] = useState("40");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	useEffect(() => {
		setFormRootType(isRootType(rootType) ? rootType : "USER");
		setFormRootId(rootId ?? "");
		setFormDepth(String(Number.isFinite(depth) ? depth : 2));
		setFormMaxEvents(String(Number.isFinite(maxEvents) ? maxEvents : 500));
		setFormMaxNodes(String(Number.isFinite(maxNodes) ? maxNodes : 600));
		setFormIncludeEvents(includeEvents);
	}, [rootType, rootId, depth, maxEvents, maxNodes, includeEvents]);

	useEffect(() => {
		let active = true;
		setInventoryLoading(true);
		void (async () => {
			try {
				const res = await apiListInventoryItems({ limit: 50, page: 1 });
				if (!active) return;
				const list = res.items ?? [];
				setInventoryItems(list);
				if (list.length > 0 && !selectedSku) {
					setSelectedSku(list[0]?.sku ?? "");
				}
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
			} finally {
				if (active) setInventoryLoading(false);
			}
		})();
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (autoSelectedRef.current) return;
		if (isRootType(rootType) && rootId) return;
		autoSelectedRef.current = true;
		let active = true;
		setError(null);
		void (async () => {
			try {
				const res = await apiListUsers({ limit: 1, page: 1 });
				if (!active) return;
				const first = res.items[0];
				if (!first?.userId) {
					setError(
						"기본 사용자 선택 실패: 사용자 데이터가 없습니다.",
					);
					return;
				}

				const sp = new URLSearchParams();
				sp.set("rootType", "USER");
				sp.set("rootId", first.userId);
				sp.set("depth", String(Number.isFinite(depth) ? depth : 2));
				sp.set(
					"maxEvents",
					String(Number.isFinite(maxEvents) ? maxEvents : 500),
				);
				sp.set(
					"maxNodes",
					String(Number.isFinite(maxNodes) ? maxNodes : 600),
				);
				sp.set("includeEvents", String(includeEvents));
				router.replace(`/?${sp.toString()}`);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(`기본 사용자 선택 실패: ${message}`);
			}
		})();
		return () => {
			active = false;
		};
	}, [rootType, rootId, router, depth, maxEvents, maxNodes, includeEvents]);

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

	useEffect(() => {
		const rt = rootType;
		const rid = rootId;
		if (!isRootType(rt) || !rid) {
			setGraph(null);
			return;
		}

		let active = true;
		setLoading(true);
		setError(null);
		void (async () => {
			try {
				const res = await apiGetGraph({
					rootType: rt,
					rootId: rid,
					depth: Number.isFinite(depth) ? depth : 2,
					maxEvents: Number.isFinite(maxEvents) ? maxEvents : 500,
					maxNodes: Number.isFinite(maxNodes) ? maxNodes : 600,
					includeEvents,
				});
				if (!active) return;
				setGraph(res);
				setSelectedId(res.rootNodeId);
			} catch (e: unknown) {
				if (!active) return;
				const message = e instanceof Error ? e.message : String(e);
				setError(message);
				setGraph(null);
				setSelectedId(null);
			} finally {
				if (active) setLoading(false);
			}
		})();

		return () => {
			active = false;
		};
	}, [
		rootType,
		rootId,
		depth,
		maxEvents,
		maxNodes,
		includeEvents,
		refreshTrigger,
	]);

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

	const elements = useMemo(() => {
		if (!graph) return [];
		const els: ElementDefinition[] = [];
		for (const n of graph.nodes) {
			const key = parseNodeKey(n.id);
			const label = `${n.type}\n${safeString(n.label)}`;
			els.push({
				data: {
					id: n.id,
					label,
					type: n.type,
					key: key.key,
					rawLabel: n.label,
					data: n.data ?? {},
				},
			});
		}
		for (const e of graph.edges) {
			els.push({
				data: {
					id: e.id,
					source: e.from,
					target: e.to,
					label: e.label ?? e.type,
					type: e.type,
				},
			});
		}
		return els;
	}, [graph]);

	const runLayout = (cy: Core) => {
		try {
			const paddingParsed = Math.trunc(Number(layoutPadding));
			const padding = Number.isFinite(paddingParsed)
				? Math.min(120, Math.max(10, paddingParsed))
				: 40;
			const opts: FcoseLayoutOptions = {
				name: "fcose",
				fit: true,
				padding,
			};
			cy.layout(opts as unknown as LayoutOptions).run();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			setError((prev) => prev ?? `레이아웃 실행 실패: ${message}`);
		}
	};

	const maybeAutoLayout = () => {
		const cy = cyRef.current;
		if (!cy || !graph) return;
		const key = `${graph.rootNodeId}|${graph.nodes.length}|${graph.edges.length}`;
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

	const graphColors = useMemo(
		() => ({
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
		}),
		[],
	);

	const stylesheet = useMemo<StylesheetJson>(
		() => [
			{
				selector: "node",
				style: {
					shape: "round-rectangle",
					"background-color": graphColors.nodeBg,
					"border-width": 1,
					"border-color": graphColors.nodeBorder,
					label: showNodeLabels ? "data(label)" : "",
					"font-size": density === "COMPACT" ? 9 : 10,
					"text-wrap": "wrap",
					"text-max-width": density === "COMPACT" ? "140px" : "180px",
					"text-valign": "center",
					"text-halign": "center",
					padding: density === "COMPACT" ? "6px" : "8px",
					width: density === "COMPACT" ? 164 : 200,
					height: density === "COMPACT" ? 46 : 54,
					color: graphColors.nodeText,
				},
			},
			{
				selector: 'node[type = "USER"]',
				style: {
					"border-color": graphColors.userBorder,
					"background-color": graphColors.userBg,
				},
			},
			{
				selector: 'node[type = "ORDER"]',
				style: {
					"border-color": graphColors.orderBorder,
					"background-color": graphColors.orderBg,
				},
			},
			{
				selector: 'node[type = "PAYMENT"]',
				style: {
					"border-color": graphColors.paymentBorder,
					"background-color": graphColors.paymentBg,
				},
			},
			{
				selector: 'node[type = "SHIPMENT"]',
				style: {
					"border-color": graphColors.shipmentBorder,
					"background-color": graphColors.shipmentBg,
				},
			},
			{
				selector: 'node[type = "EVENT"]',
				style: {
					"border-color": graphColors.eventBorder,
					"background-color": graphColors.eventBg,
				},
			},
			{
				selector: `node[id = "${graph?.rootNodeId ?? ""}"]`,
				style: {
					"border-width": 2,
					"border-color": graphColors.rootBorder,
				},
			},
			{
				selector: "edge",
				style: {
					"curve-style": "bezier",
					"line-color": graphColors.edge,
					"target-arrow-shape": "triangle",
					"target-arrow-color": graphColors.edge,
					"arrow-scale": 0.8,
					width: 1,
					label: showEdgeLabels ? "data(label)" : "",
					"font-size": 9,
					"text-rotation": "autorotate",
					"text-margin-y": showEdgeLabels ? -6 : 0,
					color: graphColors.edgeText,
				},
			},
			{
				selector: "node:selected",
				style: {
					"border-width": 3,
					"border-color": graphColors.selectedBorder,
				},
			},
		],
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
			<div className="flex items-center justify-between">
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

			<form
				className="surface mt-4 flex flex-wrap items-end gap-3 p-4 text-sm"
				onSubmit={(e) => {
					e.preventDefault();
					pushQuery({
						rootType: formRootType,
						rootId: formRootId,
						depth: formDepth,
						maxEvents: formMaxEvents,
						maxNodes: formMaxNodes,
						includeEvents: formIncludeEvents,
					});
				}}
			>
				<label className="grid gap-1">
					<span className="field-label">RootType</span>
					<select
						className="input"
						value={formRootType}
						onChange={(e) =>
							setFormRootType(e.target.value as RootType)
						}
					>
						<option value="USER">USER</option>
						<option value="ORDER">ORDER</option>
						<option value="PAYMENT">PAYMENT</option>
						<option value="SHIPMENT">SHIPMENT</option>
					</select>
				</label>

				<label className="grid gap-1">
					<span className="field-label">RootId</span>
					<input
						className="input h-10 w-[340px] max-w-full font-mono text-xs"
						value={formRootId}
						onChange={(e) => setFormRootId(e.target.value)}
						placeholder="예: dummy-1 또는 주문/결제/배송 ID"
					/>
				</label>

				<label className="grid gap-1">
					<span className="field-label">Depth (0~4)</span>
					<input
						type="number"
						min={0}
						max={4}
						step={1}
						className="input w-20"
						value={formDepth}
						onChange={(e) => setFormDepth(e.target.value)}
					/>
				</label>

				<label className="grid gap-1">
					<span className="field-label">MaxEvents</span>
					<input
						className="input w-28"
						value={formMaxEvents}
						onChange={(e) => setFormMaxEvents(e.target.value)}
					/>
				</label>

				<label className="input flex items-center gap-2 px-3">
					<input
						type="checkbox"
						checked={formIncludeEvents}
						onChange={(e) => setFormIncludeEvents(e.target.checked)}
					/>
					<span className="text-xs text-foreground">EVENT 포함</span>
				</label>

				<label className="grid gap-1">
					<span className="field-label">MaxNodes</span>
					<input
						className="input w-28"
						value={formMaxNodes}
						onChange={(e) => setFormMaxNodes(e.target.value)}
					/>
				</label>

				<button className="btn btn-primary h-10 px-4" type="submit">
					조회
				</button>

				<div className="ml-auto flex flex-wrap items-end gap-2">
					<label className="grid gap-1">
						<span className="field-label">노드 검색</span>
						<input
							className="input h-10 w-[260px] max-w-full"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder="id/label 일부 입력"
						/>
					</label>
					<button
						type="button"
						className="btn h-10"
						onClick={() => {
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
						}}
					>
						선택/센터
					</button>
				</div>
			</form>

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
				<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
					<div className="table-shell relative z-0">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-medium">레이아웃</span>
								<button
									className="btn h-7 px-2 py-1 text-xs"
									onClick={() => {
										const cy = cyRef.current;
										if (!cy) return;
										runLayout(cy);
									}}
								>
									재정렬
								</button>
								<button
									className="btn h-7 px-2 py-1 text-xs"
									onClick={() =>
										cyRef.current?.fit(undefined, 40)
									}
								>
									전체 보기
								</button>
								<label className="input flex h-7 items-center gap-2 px-2">
									<span className="text-[11px]">패딩</span>
									<input
										className="w-10 bg-transparent text-[11px] outline-none"
										value={layoutPadding}
										onChange={(e) =>
											setLayoutPadding(e.target.value)
										}
										inputMode="numeric"
									/>
								</label>
								<select
									className="input h-7 px-2 py-0 text-[11px]"
									value={density}
									onChange={(e) =>
										setDensity(
											e.target.value === "COMPACT"
												? "COMPACT"
												: "COMFORTABLE",
										)
									}
								>
									<option value="COMPACT">Compact</option>
									<option value="COMFORTABLE">
										Comfortable
									</option>
								</select>
								<label className="input flex h-7 items-center gap-1 px-2 text-[11px]">
									<input
										type="checkbox"
										checked={showNodeLabels}
										onChange={(e) =>
											setShowNodeLabels(e.target.checked)
										}
									/>
									노드 라벨
								</label>
								<label className="input flex h-7 items-center gap-1 px-2 text-[11px]">
									<input
										type="checkbox"
										checked={showEdgeLabels}
										onChange={(e) =>
											setShowEdgeLabels(e.target.checked)
										}
									/>
									엣지 라벨
								</label>
							</div>
							<div className="text-muted-foreground">
								nodes: {graph.nodes.length}, edges:{" "}
								{graph.edges.length}
							</div>
						</div>

						<div className="relative z-0 h-[640px] overflow-hidden">
							<CytoscapeComponent
								elements={elements}
								stylesheet={stylesheet}
								style={{ width: "100%", height: "100%" }}
								cy={(cy: Core) => {
									cyRef.current = cy;
									cy.off("tap", "node");
									cy.on("tap", "node", (evt: EventObject) => {
										const id = evt.target.id();
										setSelectedId(id);
										const original =
											evt.originalEvent as unknown as
												| { shiftKey?: boolean }
												| undefined;
										if (original?.shiftKey) {
											const parsed = parseNodeKey(id);
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
													includeEvents:
														formIncludeEvents,
												});
											}
										}
									});
									maybeAutoLayout();
								}}
							/>
						</div>
					</div>

					<div className="surface relative z-10 p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm font-semibold">상세</div>
							<button
								type="button"
								className="btn h-7 px-2 py-1 text-xs"
								onClick={refreshGraph}
							>
								새로고침
							</button>
						</div>

						{selectedNode ? (
							<div className="mt-3 grid gap-2 text-sm">
								<div className="surface-muted px-3 py-2">
									<div className="text-xs text-muted-foreground">
										NodeId
									</div>
									<div className="break-all font-mono text-xs">
										{selectedNode.id}
									</div>
								</div>

								{selectedNode.type !== "EVENT" ? (
									<Link
										className="btn btn-primary h-auto py-2 text-center text-xs"
										href={`/?rootType=${encodeURIComponent(
											selectedNode.type,
										)}&rootId=${encodeURIComponent(parseNodeKey(selectedNode.id).key)}&depth=${encodeURIComponent(String(Number.isFinite(depth) ? depth : 2))}&maxEvents=${encodeURIComponent(String(Number.isFinite(maxEvents) ? maxEvents : 500))}&maxNodes=${encodeURIComponent(String(Number.isFinite(maxNodes) ? maxNodes : 600))}`}
									>
										이 노드를 루트로 보기
									</Link>
								) : null}

								<div className="surface px-3 py-2">
									<div className="text-xs text-muted-foreground">
										Data
									</div>
									<pre className="mt-1 max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded bg-surface-muted p-2 text-xs">
										{JSON.stringify(
											selectedNode.data ?? {},
											null,
											2,
										)}
									</pre>
								</div>

								{selectedNode.type === "USER" ? (
									<div className="surface mt-2 px-3 py-3">
										<div className="text-sm font-semibold">
											주문 생성
										</div>
										<div className="mt-3 grid gap-3">
											<div className="grid gap-1">
												<div className="field-label">
													UserId
												</div>
												<div className="font-mono text-xs">
													{
														parseNodeKey(
															selectedNode.id,
														).key
													}
												</div>
											</div>
											<label className="grid gap-1">
												<span className="field-label">
													재고(SKU)
												</span>
												<select
													className="input font-mono text-xs"
													value={selectedSku}
													onChange={(e) =>
														setSelectedSku(
															e.target.value,
														)
													}
													disabled={
														inventoryLoading ||
														inventoryItems.length ===
															0
													}
												>
													{inventoryItems.map(
														(it) => (
															<option
																key={it.itemId}
																value={it.sku}
															>
																{it.sku} (
																{
																	it.price
																		.currency
																}{" "}
																{
																	it.price
																		.amountMinor
																}
																)
															</option>
														),
													)}
												</select>
											</label>

											<div className="grid grid-cols-2 gap-3">
												<label className="grid gap-1">
													<span className="field-label">
														수량
													</span>
													<input
														className="input"
														value={selectedQuantity}
														onChange={(e) =>
															setSelectedQuantity(
																e.target.value,
															)
														}
														inputMode="numeric"
													/>
												</label>
												<div className="grid gap-1">
													<span className="field-label">
														총액
													</span>
													<div className="surface-muted h-10 px-3 text-sm leading-10">
														{computedOrderMoney
															? `${computedOrderMoney.currency} ${computedOrderMoney.amountMinor}`
															: "-"}
													</div>
												</div>
											</div>

											<button
												className="btn btn-primary h-10"
												disabled={
													creatingOrder ||
													!selectedInventory ||
													!computedOrderMoney
												}
												onClick={async () => {
													setError(null);
													setCreatingOrder(true);
													try {
														const userId =
															parseNodeKey(
																selectedNode.id,
															).key;
														if (
															!selectedInventory ||
															!computedOrderMoney
														) {
															setError(
																"재고를 선택해 주세요.",
															);
															return;
														}
														const res =
															await apiCreateOrder(
																{
																	userId,
																	amount: computedOrderMoney.amountMinor,
																	currency:
																		(() => {
																			const c =
																				computedOrderMoney.currency;
																			if (
																				c ===
																					"KRW" ||
																				c ===
																					"USD"
																			)
																				return c;
																			throw new Error(
																				`지원하지 않는 통화입니다: ${c}`,
																			);
																		})(),
																	items: [
																		{
																			sku: selectedInventory.sku,
																			quantity:
																				orderQuantity,
																		},
																	],
																},
															);
														pushQuery({
															rootType: "ORDER",
															rootId: res.orderId,
															depth: formDepth,
															maxEvents:
																formMaxEvents,
															maxNodes:
																formMaxNodes,
															includeEvents:
																formIncludeEvents,
														});
													} catch (e: unknown) {
														const message =
															e instanceof Error
																? e.message
																: String(e);
														setError(message);
													} finally {
														setCreatingOrder(false);
													}
												}}
											>
												주문 생성
											</button>
										</div>
									</div>
								) : null}

								{selectedNode.type === "ORDER" ? (
									<div className="surface mt-2 px-3 py-3">
										<div className="text-sm font-semibold">
											결제 인텐트 생성(시뮬레이터)
										</div>
										<div className="mt-3 grid gap-3">
											<label className="grid gap-1">
												<span className="field-label">
													결과
												</span>
												<select
													className="input"
													value={createPaymentOutcome}
													onChange={(e) => {
														const v =
															e.target.value;
														setCreatePaymentOutcome(
															v === "FAILED"
																? "FAILED"
																: "SUCCEEDED",
														);
													}}
												>
													<option value="SUCCEEDED">
														SUCCEEDED
													</option>
													<option value="FAILED">
														FAILED
													</option>
												</select>
											</label>

											<button
												className="btn btn-primary h-10"
												disabled={creatingPayment}
												onClick={async () => {
													setError(null);
													setCreatingPayment(true);
													try {
														const orderId =
															parseNodeKey(
																selectedNode.id,
															).key;
														const res =
															(await apiCreatePaymentIntent(
																orderId,
																{
																	simulateOutcome:
																		createPaymentOutcome,
																},
															)) as {
																paymentId?: string;
															};
														const paymentId =
															typeof res?.paymentId ===
															"string"
																? res.paymentId
																: null;
														if (!paymentId) {
															setError(
																"결제 인텐트 생성에 실패했습니다.",
															);
															return;
														}
														pushQuery({
															rootType: "PAYMENT",
															rootId: paymentId,
															depth: formDepth,
															maxEvents:
																formMaxEvents,
															maxNodes:
																formMaxNodes,
															includeEvents:
																formIncludeEvents,
														});
													} catch (e: unknown) {
														const message =
															e instanceof Error
																? e.message
																: String(e);
														setError(message);
													} finally {
														setCreatingPayment(
															false,
														);
													}
												}}
											>
												결제 인텐트 생성
											</button>
										</div>
									</div>
								) : null}
							</div>
						) : (
							<div className="mt-3 text-sm text-muted-foreground">
								노드를 클릭하시면 상세가 표시됩니다.
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
