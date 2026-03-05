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
