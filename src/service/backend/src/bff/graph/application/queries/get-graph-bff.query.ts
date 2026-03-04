import { Query } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoolean,
	toBoundedInt,
} from '@/shared/cqrs/input-normalizer';

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
	public readonly input: {
		rootType: GraphRootType;
		rootId: string;
		depth: number;
		maxEvents?: number;
		maxNodes?: number;
		includeEvents: boolean;
	};

	constructor(input: {
		rootType: GraphRootType;
		rootId: string;
		depth?: number;
		maxEvents?: number;
		maxNodes?: number;
		includeEvents?: boolean | string;
	}) {
		super();
		const depth = toBoundedInt(input.depth, {
			min: 0,
			max: 4,
			fallback: 2,
		});

		this.input = {
			rootType: input.rootType,
			rootId: requireTrimmedString(
				input.rootId,
				ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
				{ reason: 'rootId' },
			),
			depth,
			maxEvents:
				input.maxEvents === undefined
					? undefined
					: toBoundedInt(input.maxEvents, {
							min: 0,
							max: 2000,
							fallback: 500,
						}),
			maxNodes:
				input.maxNodes === undefined
					? undefined
					: toBoundedInt(input.maxNodes, {
							min: 1,
							max: 2000,
							fallback: 600,
						}),
			includeEvents: toBoolean(input.includeEvents, true),
		};
	}
}
