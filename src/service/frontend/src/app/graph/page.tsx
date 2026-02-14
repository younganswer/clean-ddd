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

export default function GraphPage() {
	return (
		<Suspense
			fallback={
				<div className="p-4 text-sm text-zinc-500">
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
	}, [rootType, rootId, depth, maxEvents, maxNodes, includeEvents]);

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
			const opts: FcoseLayoutOptions = {
				name: "fcose",
				fit: true,
				padding: 40,
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

	const stylesheet = useMemo<StylesheetJson>(
		() => [
			{
				selector: "node",
				style: {
					shape: "round-rectangle",
					"background-color": "#ffffff",
					"border-width": 1,
					"border-color": "#d4d4d8",
					label: "data(label)",
					"font-size": 10,
					"text-wrap": "wrap",
					"text-max-width": "180px",
					"text-valign": "center",
					"text-halign": "center",
					padding: "8px",
					width: 200,
					height: 54,
					color: "#18181b",
				},
			},
			{
				selector: 'node[type = "USER"]',
				style: {
					"border-color": "#38bdf8",
					"background-color": "#f0f9ff",
				},
			},
			{
				selector: 'node[type = "ORDER"]',
				style: {
					"border-color": "#34d399",
					"background-color": "#ecfdf5",
				},
			},
			{
				selector: 'node[type = "PAYMENT"]',
				style: {
					"border-color": "#c4b5fd",
					"background-color": "#f5f3ff",
				},
			},
			{
				selector: 'node[type = "SHIPMENT"]',
				style: {
					"border-color": "#fdba74",
					"background-color": "#fff7ed",
				},
			},
			{
				selector: 'node[type = "EVENT"]',
				style: {
					"border-color": "#a1a1aa",
					"background-color": "#fafafa",
				},
			},
			{
				selector: `node[id = "${graph?.rootNodeId ?? ""}"]`,
				style: {
					"border-width": 2,
					"border-color": "#0ea5e9",
				},
			},
			{
				selector: "edge",
				style: {
					"curve-style": "bezier",
					"line-color": "#a1a1aa",
					"target-arrow-shape": "triangle",
					"target-arrow-color": "#a1a1aa",
					"arrow-scale": 0.8,
					width: 1,
					label: "data(label)",
					"font-size": 9,
					"text-rotation": "autorotate",
					"text-margin-y": -6,
					color: "#71717a",
				},
			},
			{
				selector: "node:selected",
				style: {
					"border-width": 3,
					"border-color": "#0284c7",
				},
			},
		],
		[graph?.rootNodeId],
	);

	return (
		<>
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">그래프 뷰</h1>
				<div className="text-sm text-zinc-600">
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
				className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 text-sm"
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
					<span className="text-xs text-zinc-600">RootType</span>
					<select
						className="h-10 rounded-md border px-3"
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
					<span className="text-xs text-zinc-600">RootId</span>
					<input
						className="h-10 w-[340px] max-w-full rounded-md border px-3 font-mono text-xs"
						value={formRootId}
						onChange={(e) => setFormRootId(e.target.value)}
						placeholder="예: dummy-1 또는 주문/결제/배송 ID"
					/>
				</label>

				<label className="grid gap-1">
					<span className="text-xs text-zinc-600">Depth (0~4)</span>
					<input
						type="number"
						min={0}
						max={4}
						step={1}
						className="h-10 w-20 rounded-md border px-3"
						value={formDepth}
						onChange={(e) => setFormDepth(e.target.value)}
					/>
				</label>

				<label className="grid gap-1">
					<span className="text-xs text-zinc-600">MaxEvents</span>
					<input
						className="h-10 w-28 rounded-md border px-3"
						value={formMaxEvents}
						onChange={(e) => setFormMaxEvents(e.target.value)}
					/>
				</label>

				<label className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
					<input
						type="checkbox"
						checked={formIncludeEvents}
						onChange={(e) => setFormIncludeEvents(e.target.checked)}
					/>
					<span className="text-xs text-zinc-700">EVENT 포함</span>
				</label>

				<label className="grid gap-1">
					<span className="text-xs text-zinc-600">MaxNodes</span>
					<input
						className="h-10 w-28 rounded-md border px-3"
						value={formMaxNodes}
						onChange={(e) => setFormMaxNodes(e.target.value)}
					/>
				</label>

				<button
					className="h-10 rounded-md bg-zinc-900 px-4 text-white hover:bg-zinc-800"
					type="submit"
				>
					조회
				</button>

				<div className="ml-auto flex flex-wrap items-end gap-2">
					<label className="grid gap-1">
						<span className="text-xs text-zinc-600">노드 검색</span>
						<input
							className="h-10 w-[260px] max-w-full rounded-md border px-3"
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							placeholder="id/label 일부 입력"
						/>
					</label>
					<button
						type="button"
						className="h-10 rounded-md border bg-white px-3 text-sm hover:bg-zinc-50"
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
				<div className="mt-6 rounded-xl border bg-white p-5 text-sm">
					<div className="text-zinc-700">
						테이블에서 객체를 클릭하시면 해당 객체 기준으로
						사용자-주문-배송-결제-이벤트 묶음 그래프를 보여드립니다.
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link
							className="rounded-md border bg-white px-3 py-2 hover:bg-zinc-50"
							href="/?rootType=USER&rootId=00000000-0000-0000-0000-000000000001"
						>
							예시(USER)
						</Link>
					</div>
				</div>
			) : null}

			{loading && (
				<div className="mt-4 text-sm text-zinc-600">불러오는 중...</div>
			)}
			{error && <div className="mt-4 text-sm text-red-600">{error}</div>}
			{graph?.truncated && (
				<div className="mt-4 text-sm text-amber-600">
					응답이 일부 생략되었습니다. 필요하시면 maxNodes를 늘려
					주세요.
				</div>
			)}

			{graph && (
				<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
					<div className="overflow-hidden rounded-xl border bg-white">
						<div className="flex flex-wrap items-center justify-between gap-2 border-b bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-medium">레이아웃</span>
								<button
									className="rounded border bg-white px-2 py-1 hover:bg-zinc-100"
									onClick={() => {
										const cy = cyRef.current;
										if (!cy) return;
										runLayout(cy);
									}}
								>
									재정렬
								</button>
								<button
									className="rounded border bg-white px-2 py-1 hover:bg-zinc-100"
									onClick={() =>
										cyRef.current?.fit(undefined, 40)
									}
								>
									전체 보기
								</button>
							</div>
							<div className="text-zinc-600">
								nodes: {graph.nodes.length}, edges:{" "}
								{graph.edges.length}
							</div>
						</div>

						<div className="h-[640px]">
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

					<div className="rounded-xl border bg-white p-4">
						<div className="flex items-center justify-between">
							<div className="text-sm font-semibold">상세</div>
							<button
								className="text-xs text-zinc-600 underline"
								onClick={() => {
									if (!graph) return;
									const rt = rootType;
									const rid = rootId;
									if (!isRootType(rt) || !rid) return;
									router.refresh();
								}}
							>
								새로고침
							</button>
						</div>

						{selectedNode ? (
							<div className="mt-3 grid gap-2 text-sm">
								<div className="rounded-md border bg-zinc-50 px-3 py-2">
									<div className="text-xs text-zinc-600">
										NodeId
									</div>
									<div className="break-all font-mono text-xs">
										{selectedNode.id}
									</div>
								</div>

								{selectedNode.type !== "EVENT" ? (
									<Link
										className="rounded-md bg-zinc-900 px-3 py-2 text-center text-xs text-white hover:bg-zinc-800"
										href={`/?rootType=${encodeURIComponent(
											selectedNode.type,
										)}&rootId=${encodeURIComponent(parseNodeKey(selectedNode.id).key)}&depth=${encodeURIComponent(String(Number.isFinite(depth) ? depth : 2))}&maxEvents=${encodeURIComponent(String(Number.isFinite(maxEvents) ? maxEvents : 500))}&maxNodes=${encodeURIComponent(String(Number.isFinite(maxNodes) ? maxNodes : 600))}`}
									>
										이 노드를 루트로 보기
									</Link>
								) : null}

								<div className="rounded-md border px-3 py-2">
									<div className="text-xs text-zinc-600">
										Data
									</div>
									<pre className="mt-1 max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-50 p-2 text-xs">
										{JSON.stringify(
											selectedNode.data ?? {},
											null,
											2,
										)}
									</pre>
								</div>

								{selectedNode.type === "USER" ? (
									<div className="mt-2 rounded-md border px-3 py-3">
										<div className="text-sm font-semibold">
											주문 생성
										</div>
										<div className="mt-3 grid gap-3">
											<div className="grid gap-1">
												<div className="text-xs text-zinc-600">
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
												<span className="text-xs text-zinc-600">
													재고(SKU)
												</span>
												<select
													className="h-10 rounded-md border px-3 font-mono text-xs"
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
													<span className="text-xs text-zinc-600">
														수량
													</span>
													<input
														className="h-10 rounded-md border px-3"
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
													<span className="text-xs text-zinc-600">
														총액
													</span>
													<div className="h-10 rounded-md border bg-zinc-50 px-3 text-sm leading-10">
														{computedOrderMoney
															? `${computedOrderMoney.currency} ${computedOrderMoney.amountMinor}`
															: "-"}
													</div>
												</div>
											</div>

											<button
												className="h-10 rounded-md bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
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
									<div className="mt-2 rounded-md border px-3 py-3">
										<div className="text-sm font-semibold">
											결제 인텐트 생성(시뮬레이터)
										</div>
										<div className="mt-3 grid gap-3">
											<label className="grid gap-1">
												<span className="text-xs text-zinc-600">
													결과
												</span>
												<select
													className="h-10 rounded-md border px-3"
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
												className="h-10 rounded-md bg-zinc-900 px-3 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
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
							<div className="mt-3 text-sm text-zinc-600">
								노드를 클릭하시면 상세가 표시됩니다.
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
