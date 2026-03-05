import { applyDecorators, type Type } from '@nestjs/common';
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiProperty,
	ApiResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import {
	buildBaseEnvelopeSchema,
	buildListEnvelopeSchema,
	buildPageEnvelopeSchema,
	type OpenApiSchema,
} from '@/common/swagger/base-response-schema.factory';
import {
	DataEnvelope,
	ErrorEnvelope,
	ErrorResponse,
	ListEnvelope,
	MessageEnvelope,
	PageEnvelope,
} from '@/common/responses';

type ApiSuccessResponseOptions = {
	description?: string;
	status?: number;
};

type ApiResponseModelOptions = {
	model: Type<unknown>;
	nullable?: boolean;
};

class PaginatedDataSchema {
	@ApiProperty({ type: 'array', items: { type: 'object' } })
	items!: unknown[];

	@ApiProperty({ example: 1 })
	page!: number;

	@ApiProperty({ example: 20 })
	limit!: number;

	@ApiProperty({ example: 100 })
	total!: number;

	@ApiProperty({ example: 5 })
	totalPages!: number;

	@ApiProperty({ example: true })
	hasNext!: boolean;
}

const resolveDataSchema = (options: ApiResponseModelOptions): OpenApiSchema => {
	const model = options.model as Parameters<typeof getSchemaPath>[0];
	if (options.nullable) {
		return {
			allOf: [{ $ref: getSchemaPath(model) }],
			nullable: true,
		};
	}
	return { $ref: getSchemaPath(model) };
};

const resolveResponseDecorator = (
	status: number,
	options: { description?: string; schema: OpenApiSchema },
) => {
	if (status === 200) {
		return ApiOkResponse({
			description: options.description,
			schema: options.schema,
		});
	}

	return ApiResponse({
		status,
		description: options.description,
		schema: options.schema,
	});
};

export const ApiDataResponse = (
	data: ApiResponseModelOptions,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [DataEnvelope, data.model];

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildBaseEnvelopeSchema(
				getSchemaPath(DataEnvelope),
				resolveDataSchema(data),
			),
		}),
	);
};

export const ApiMessageResponse = (
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;

	return applyDecorators(
		ApiExtraModels(MessageEnvelope),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: {
				$ref: getSchemaPath(MessageEnvelope),
			},
		}),
	);
};

export const ApiListResponse = (
	item: ApiResponseModelOptions,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [ListEnvelope, item.model];

	const itemSchema = resolveDataSchema(item);

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildListEnvelopeSchema(
				getSchemaPath(ListEnvelope),
				itemSchema,
			),
		}),
	);
};

export const ApiPageResponse = (
	item: ApiResponseModelOptions,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [
		PageEnvelope,
		PaginatedDataSchema,
		item.model,
	];

	const itemSchema = resolveDataSchema(item);

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildPageEnvelopeSchema(
				getSchemaPath(PageEnvelope),
				getSchemaPath(PaginatedDataSchema),
				itemSchema,
			),
		}),
	);
};

export const ApiErrorEnvelopeResponse = (options: {
	status: number;
	description?: string;
}): MethodDecorator => {
	return applyDecorators(
		ApiExtraModels(ErrorEnvelope, ErrorResponse),
		ApiResponse({
			status: options.status,
			description: options.description,
			schema: {
				$ref: getSchemaPath(ErrorEnvelope),
			},
		}),
	);
};
