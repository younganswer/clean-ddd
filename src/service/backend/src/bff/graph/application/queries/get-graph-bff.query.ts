import { Query } from '@nestjs/cqrs';
import { OrderingOrderIdRequiredException } from '@/shared/exceptions';
import {
	toTrimmedString,
	toBoolean,
	toBoundedInt,
} from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
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
		const rootId = toTrimmedString(input.rootId);
		if (!rootId) {
			throw ApplicationExceptionFactory.create(
				OrderingOrderIdRequiredException,
				{ description: 'rootId' },
			);
		}

		this.rootId = rootId;
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
