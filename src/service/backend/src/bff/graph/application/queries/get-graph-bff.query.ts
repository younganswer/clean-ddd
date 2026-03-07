import { Query } from '@nestjs/cqrs';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoolean,
	toBoundedInt,
} from '@/common/cqrs/input-normalizer';
import type { GraphView } from '@/bff/graph/application/views/graph.view';

export type GraphRootType = 'USER' | 'ORDER' | 'SHIPMENT' | 'PAYMENT';

export class GetGraphBffQuery extends Query<GraphView | null> {
	public readonly rootType: GraphRootType;
	public readonly rootId: string;
	public readonly depth: number;
	public readonly maxEvents?: number;
	public readonly maxNodes?: number;
	public readonly includeEvents: boolean;

	constructor(input: {
		rootType: GraphRootType;
		rootId: string;
		depth?: number;
		maxEvents?: number;
		maxNodes?: number;
		includeEvents?: boolean | string;
	}) {
		super();
		this.rootType = input.rootType;
		this.rootId = requireTrimmedString(
			input.rootId,
			ORDERING_APPLICATION_ERRORS.ORDER_ID_REQUIRED,
			{ reason: 'rootId' },
		);
		this.depth = toBoundedInt(input.depth, {
			min: 0,
			max: 4,
			fallback: 2,
		});
		this.maxEvents =
			input.maxEvents === undefined
				? undefined
				: toBoundedInt(input.maxEvents, {
						min: 0,
						max: 2000,
						fallback: 500,
					});
		this.maxNodes =
			input.maxNodes === undefined
				? undefined
				: toBoundedInt(input.maxNodes, {
						min: 1,
						max: 2000,
						fallback: 600,
					});
		this.includeEvents = toBoolean(input.includeEvents, true);
	}
}
