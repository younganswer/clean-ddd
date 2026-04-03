import Link from "next/link";

import type { GraphNode, InventoryItem } from "@/lib/api";
import {
	DEFAULT_DEPTH,
	DEFAULT_MAX_EVENTS,
	DEFAULT_MAX_NODES,
	finiteOrDefault,
	parseNodeKey,
} from "@/app/graph/_lib/graph-helpers";

type Props = {
	selectedNode: GraphNode | null;
	depth: number;
	maxEvents: number;
	maxNodes: number;
	inventoryItems: InventoryItem[];
	inventoryLoading: boolean;
	selectedSku: string;
	selectedQuantity: string;
	computedOrderMoney: {
		currency: string;
		amountMinor: number;
	} | null;
	creatingOrder: boolean;
	createPaymentOutcome: "SUCCEEDED" | "FAILED";
	creatingPayment: boolean;
	onRefresh: () => void;
	onSelectedSkuChange: (value: string) => void;
	onSelectedQuantityChange: (value: string) => void;
	onCreatePaymentOutcomeChange: (value: "SUCCEEDED" | "FAILED") => void;
	onCreateOrder: () => Promise<void>;
	onCreatePaymentIntent: () => Promise<void>;
};

export const GraphDetailPanel = ({
	selectedNode,
	depth,
	maxEvents,
	maxNodes,
	inventoryItems,
	inventoryLoading,
	selectedSku,
	selectedQuantity,
	computedOrderMoney,
	creatingOrder,
	createPaymentOutcome,
	creatingPayment,
	onRefresh,
	onSelectedSkuChange,
	onSelectedQuantityChange,
	onCreatePaymentOutcomeChange,
	onCreateOrder,
	onCreatePaymentIntent,
}: Props) => {
	return (
		<div className="surface relative z-10 min-w-0 max-w-full overflow-x-hidden p-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="text-sm font-semibold">상세</div>
				<button
					type="button"
					className="btn h-7 px-2 py-1 text-xs"
					onClick={onRefresh}
				>
					새로고침
				</button>
			</div>

			{selectedNode ? (
				<div className="mt-3 grid min-w-0 gap-2 text-sm">
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
							href={`/graph?rootType=${encodeURIComponent(
								selectedNode.type,
							)}&rootId=${encodeURIComponent(parseNodeKey(selectedNode.id).key)}&depth=${encodeURIComponent(String(finiteOrDefault(depth, DEFAULT_DEPTH)))}&maxEvents=${encodeURIComponent(String(finiteOrDefault(maxEvents, DEFAULT_MAX_EVENTS)))}&maxNodes=${encodeURIComponent(String(finiteOrDefault(maxNodes, DEFAULT_MAX_NODES)))}`}
						>
							이 노드를 루트로 보기
						</Link>
					) : null}

					<div className="surface min-w-0 px-3 py-2">
						<div className="text-xs text-muted-foreground">
							Data
						</div>
						<pre className="mt-1 max-h-[360px] min-w-0 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-muted p-2 text-xs">
							{JSON.stringify(selectedNode.data ?? {}, null, 2)}
						</pre>
					</div>

					{selectedNode.type === "USER" ? (
						<div className="surface mt-2 px-3 py-3">
							<div className="text-sm font-semibold">
								주문 생성
							</div>
							<div className="mt-3 grid gap-3">
								<div className="grid gap-1">
									<div className="field-label">UserId</div>
									<div className="break-all font-mono text-xs">
										{parseNodeKey(selectedNode.id).key}
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
											onSelectedSkuChange(e.target.value)
										}
										disabled={
											inventoryLoading ||
											inventoryItems.length === 0
										}
									>
										{inventoryItems.map((item) => (
											<option
												key={item.itemId}
												value={item.sku}
											>
												{item.sku} (
												{item.price.currency}{" "}
												{item.price.amountMinor})
											</option>
										))}
									</select>
								</label>

								<div className="grid gap-3 sm:grid-cols-2">
									<label className="grid gap-1">
										<span className="field-label">
											수량
										</span>
										<input
											className="input"
											value={selectedQuantity}
											onChange={(e) =>
												onSelectedQuantityChange(
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
										!computedOrderMoney ||
										!selectedSku
									}
									onClick={() => void onCreateOrder()}
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
									<span className="field-label">결과</span>
									<select
										className="input"
										value={createPaymentOutcome}
										onChange={(e) =>
											onCreatePaymentOutcomeChange(
												e.target.value === "FAILED"
													? "FAILED"
													: "SUCCEEDED",
											)
										}
									>
										<option value="SUCCEEDED">
											SUCCEEDED
										</option>
										<option value="FAILED">FAILED</option>
									</select>
								</label>

								<button
									className="btn btn-primary h-10"
									disabled={creatingPayment}
									onClick={() => void onCreatePaymentIntent()}
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
	);
};
