"use client";

import Link from "next/link";
import { Suspense } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";

import { GraphCanvas } from "@/app/graph/_components/graph-canvas";
import { GraphDetailPanel } from "@/app/graph/_components/graph-detail-panel";
import { GraphQueryForm } from "@/app/graph/_components/graph-query-form";
import { useGraphPageState } from "@/app/graph/_hooks/use-graph-page-state";

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
	const {
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
		onSubmitQuery,
		onSelectAndCenter,
		onRelayout,
		onFit,
		onCyReady,
		onNodeTap,
		onRefreshGraph,
		onCreateOrder,
		onCreatePaymentIntent,
	} = useGraphPageState();

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
				onSubmit={onSubmitQuery}
				onSelectAndCenter={onSelectAndCenter}
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
				<div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
					<GraphCanvas
						graph={graph}
						elements={elements}
						stylesheet={stylesheet}
						layoutPadding={layoutPadding}
						density={density}
						showNodeLabels={showNodeLabels}
						showEdgeLabels={showEdgeLabels}
						onRelayout={onRelayout}
						onFit={onFit}
						onLayoutPaddingChange={setLayoutPadding}
						onDensityChange={setDensity}
						onShowNodeLabelsChange={setShowNodeLabels}
						onShowEdgeLabelsChange={setShowEdgeLabels}
						onCyReady={onCyReady}
						onNodeTap={onNodeTap}
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
						onRefresh={onRefreshGraph}
						onSelectedSkuChange={setSelectedSku}
						onSelectedQuantityChange={setSelectedQuantity}
						onCreatePaymentOutcomeChange={setCreatePaymentOutcome}
						onCreateOrder={onCreateOrder}
						onCreatePaymentIntent={onCreatePaymentIntent}
					/>
				</div>
			)}
		</div>
	);
}
