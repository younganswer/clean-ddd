import { Query } from '@nestjs/cqrs';

export type GraphRootType = 'USER' | 'ORDER' | 'SHIPMENT' | 'PAYMENT';

export type GraphNodeType = 'USER' | 'ORDER' | 'SHIPMENT' | 'PAYMENT' | 'EVENT';

export type GraphEdgeType = 'OWNS' | 'REFERENCES' | 'EMITS';

export type GraphNode = {
	id: string;
	type: GraphNodeType;
	label: string;
	data?: Record<string, unknown>;
};

export type GraphEdge = {
	id: string;
	from: string;
	to: string;
	type: GraphEdgeType;
	label?: string;
};

export type GraphView = {
	rootNodeId: string;
	nodes: GraphNode[];
	edges: GraphEdge[];
	truncated?: boolean;
};

export class GetGraphBffQuery extends Query<GraphView | null> {
	constructor(
		public readonly input: {
			rootType: GraphRootType;
			rootId: string;
			depth?: number;
			maxEvents?: number;
			maxNodes?: number;
			includeEvents?: boolean;
		},
	) {
		super();
	}
}
