import { applyDecorators, type Type } from '@nestjs/common';
import {
	ApiExtraModels,
	ApiOkResponse,
	ApiProperty,
	ApiResponse,
	getSchemaPath,
} from '@nestjs/swagger';
import {
	buildBaseResponseSchema,
	buildListResponseSchema,
	buildPageResponseSchema,
	type OpenApiSchema,
} from '@/common/swagger/base-response-schema.factory';
import {
	DataResponse,
	ErrorData,
	ErrorResponse,
	ListResponse,
	MessageResponse,
	PageResponse,
} from '@/common/responses';

type ApiSuccessResponseOptions = {
	description?: string;
	status?: number;
};

type ApiModelOrSchema = {
	model?: Type<unknown>;
	schema?: unknown;
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

const resolveDataSchema = (options: ApiModelOrSchema): OpenApiSchema => {
	if (options.model) {
		const model = options.model as Parameters<typeof getSchemaPath>[0];
		if (options.nullable) {
			return {
				allOf: [{ $ref: getSchemaPath(model) }],
				nullable: true,
			};
		}
		return { $ref: getSchemaPath(model) };
	}

	if (options.schema) {
		return options.schema as OpenApiSchema;
	}

	return { type: 'object' };
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
	data: ApiModelOrSchema,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [DataResponse];
	if (data.model) models.push(data.model);

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildBaseResponseSchema(
				getSchemaPath(DataResponse),
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
		ApiExtraModels(MessageResponse),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: {
				$ref: getSchemaPath(MessageResponse),
			},
		}),
	);
};

export const ApiListResponse = (
	item: ApiModelOrSchema,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [ListResponse];
	if (item.model) models.push(item.model);

	const itemSchema = resolveDataSchema(item);

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildListResponseSchema(
				getSchemaPath(ListResponse),
				itemSchema,
			),
		}),
	);
};

export const ApiPageResponse = (
	item: ApiModelOrSchema,
	options: ApiSuccessResponseOptions = {},
): MethodDecorator => {
	const status = options.status ?? 200;
	const models: Type<unknown>[] = [PageResponse, PaginatedDataSchema];
	if (item.model) models.push(item.model);

	const itemSchema = resolveDataSchema(item);

	return applyDecorators(
		ApiExtraModels(...models),
		resolveResponseDecorator(status, {
			description: options.description,
			schema: buildPageResponseSchema(
				getSchemaPath(PageResponse),
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
		ApiExtraModels(ErrorResponse, ErrorData),
		ApiResponse({
			status: options.status,
			description: options.description,
			schema: {
				$ref: getSchemaPath(ErrorResponse),
			},
		}),
	);
};
