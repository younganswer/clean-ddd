import type {
	ReferenceObject,
	SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export type OpenApiSchema = SchemaObject | ReferenceObject;

export const buildBaseResponseSchema = (
	baseResponseRef: string,
	dataSchema: OpenApiSchema,
): OpenApiSchema => {
	return {
		allOf: [{ $ref: baseResponseRef }],
		properties: {
			data: dataSchema,
		},
	};
};

export const buildListResponseSchema = (
	listResponseRef: string,
	itemSchema: OpenApiSchema,
): OpenApiSchema => {
	return buildBaseResponseSchema(listResponseRef, {
		type: 'array',
		items: itemSchema,
	});
};

export const buildPageResponseSchema = (
	pageResponseRef: string,
	paginatedDataRef: string,
	itemSchema: OpenApiSchema,
): OpenApiSchema => {
	return buildBaseResponseSchema(pageResponseRef, {
		allOf: [{ $ref: paginatedDataRef }],
		properties: {
			items: {
				type: 'array',
				items: itemSchema,
			},
		},
	});
};
