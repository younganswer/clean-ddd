import { ApiProperty } from '@nestjs/swagger';

export class GraphNodeResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	type!: string;

	@ApiProperty()
	label!: string;

	@ApiProperty({ required: false, type: Object, additionalProperties: true })
	data?: Record<string, unknown>;
}

export class GraphEdgeResponseDto {
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
}

export class GraphResponseDto {
	@ApiProperty()
	rootNodeId!: string;

	@ApiProperty({ type: [GraphNodeResponseDto] })
	nodes!: GraphNodeResponseDto[];

	@ApiProperty({ type: [GraphEdgeResponseDto] })
	edges!: GraphEdgeResponseDto[];

	@ApiProperty({ required: false })
	truncated?: boolean;
}
