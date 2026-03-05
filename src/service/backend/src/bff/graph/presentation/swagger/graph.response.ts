import { ApiProperty } from '@nestjs/swagger';
import type {
	GraphEdge,
	GraphNode,
	GraphView,
} from '@/bff/graph/application/queries/get-graph-bff.query';

export class GraphNodeResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	type!: string;

	@ApiProperty()
	label!: string;

	@ApiProperty({ required: false, type: Object, additionalProperties: true })
	data?: Record<string, unknown>;

	static fromResult(result: GraphNode): GraphNodeResponse {
		return {
			id: result.id,
			type: result.type,
			label: result.label,
			data: result.data,
		};
	}
}

export class GraphEdgeResponse {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	from!: string;

	@ApiProperty()
	to!: string;

	@ApiProperty()
	type!: string;

	@ApiProperty({ required: false })
	label?: string;

	static fromResult(result: GraphEdge): GraphEdgeResponse {
		return {
			id: result.id,
			from: result.from,
			to: result.to,
			type: result.type,
			label: result.label,
		};
	}
}

export class GraphResponse {
	@ApiProperty()
	rootNodeId!: string;

	@ApiProperty({ type: [GraphNodeResponse] })
	nodes!: GraphNodeResponse[];

	@ApiProperty({ type: [GraphEdgeResponse] })
	edges!: GraphEdgeResponse[];

	@ApiProperty({ required: false })
	truncated?: boolean;

	static fromResult(result: GraphView): GraphResponse {
		return {
			rootNodeId: result.rootNodeId,
			nodes: result.nodes.map((node) =>
				GraphNodeResponse.fromResult(node),
			),
			edges: result.edges.map((edge) =>
				GraphEdgeResponse.fromResult(edge),
			),
			truncated: result.truncated,
		};
	}
}
