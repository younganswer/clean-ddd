import CytoscapeComponent from "react-cytoscapejs";
import type {
	Core,
	ElementDefinition,
	EventObject,
	StylesheetJson,
} from "cytoscape";

import type { GraphView } from "@/lib/api";
import type { GraphDensity } from "@/app/graph/_lib/graph-helpers";

type Props = {
	graph: GraphView;
	elements: ElementDefinition[];
	stylesheet: StylesheetJson;
	layoutPadding: string;
	density: GraphDensity;
	showNodeLabels: boolean;
	showEdgeLabels: boolean;
	onRelayout: () => void;
	onFit: () => void;
	onLayoutPaddingChange: (value: string) => void;
	onDensityChange: (value: GraphDensity) => void;
	onShowNodeLabelsChange: (checked: boolean) => void;
	onShowEdgeLabelsChange: (checked: boolean) => void;
	onCyReady: (cy: Core) => void;
	onNodeTap: (nodeId: string, shiftKey: boolean) => void;
};

export function GraphCanvas({
	graph,
	elements,
	stylesheet,
	layoutPadding,
	density,
	showNodeLabels,
	showEdgeLabels,
	onRelayout,
	onFit,
	onLayoutPaddingChange,
	onDensityChange,
	onShowNodeLabelsChange,
	onShowEdgeLabelsChange,
	onCyReady,
	onNodeTap,
}: Props) {
	return (
		<div className="table-shell relative z-0">
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-medium">레이아웃</span>
					<button
						className="btn h-7 px-2 py-1 text-xs"
						onClick={onRelayout}
					>
						재정렬
					</button>
					<button
						className="btn h-7 px-2 py-1 text-xs"
						onClick={onFit}
					>
						전체 보기
					</button>
					<label className="input flex h-7 items-center gap-2 px-2">
						<span className="text-[11px]">패딩</span>
						<input
							className="w-10 bg-transparent text-[11px] outline-none"
							value={layoutPadding}
							onChange={(e) =>
								onLayoutPaddingChange(e.target.value)
							}
							inputMode="numeric"
						/>
					</label>
					<select
						className="input h-7 px-2 py-0 text-[11px]"
						value={density}
						onChange={(e) =>
							onDensityChange(
								e.target.value === "COMPACT"
									? "COMPACT"
									: "COMFORTABLE",
							)
						}
					>
						<option value="COMPACT">Compact</option>
						<option value="COMFORTABLE">Comfortable</option>
					</select>
					<label className="input flex h-7 items-center gap-1 px-2 text-[11px]">
						<input
							type="checkbox"
							checked={showNodeLabels}
							onChange={(e) =>
								onShowNodeLabelsChange(e.target.checked)
							}
						/>
						노드 라벨
					</label>
					<label className="input flex h-7 items-center gap-1 px-2 text-[11px]">
						<input
							type="checkbox"
							checked={showEdgeLabels}
							onChange={(e) =>
								onShowEdgeLabelsChange(e.target.checked)
							}
						/>
						엣지 라벨
					</label>
				</div>
				<div className="text-muted-foreground">
					nodes: {graph.nodes.length}, edges: {graph.edges.length}
				</div>
			</div>

			<div className="relative z-0 h-[440px] overflow-hidden md:h-[560px] xl:h-[640px]">
				<CytoscapeComponent
					elements={elements}
					stylesheet={stylesheet}
					style={{ width: "100%", height: "100%" }}
					cy={(cy: Core) => {
						cy.off("tap", "node");
						cy.on("tap", "node", (evt: EventObject) => {
							const nodeId = evt.target.id();
							const original = evt.originalEvent as
								| { shiftKey?: boolean }
								| undefined;
							onNodeTap(nodeId, !!original?.shiftKey);
						});
						onCyReady(cy);
					}}
				/>
			</div>
		</div>
	);
}
