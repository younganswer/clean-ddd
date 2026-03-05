import type {
	ReferenceObject,
	SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export type OpenApiSchema = SchemaObject | ReferenceObject;

export const buildBaseEnvelopeSchema = (
	baseEnvelopeRef: string,
	dataSchema: OpenApiSchema,
): OpenApiSchema => {
	return {
		allOf: [{ $ref: baseEnvelopeRef }],
		properties: {
			data: dataSchema,
		},
	};
};

export const buildListEnvelopeSchema = (
	listEnvelopeRef: string,
	itemSchema: OpenApiSchema,
): OpenApiSchema => {
	return buildBaseEnvelopeSchema(listEnvelopeRef, {
		type: 'array',
		items: itemSchema,
	});
};

export const buildPageEnvelopeSchema = (
	pageEnvelopeRef: string,
	paginatedDataRef: string,
	itemSchema: OpenApiSchema,
): OpenApiSchema => {
	return buildBaseEnvelopeSchema(pageEnvelopeRef, {
		allOf: [{ $ref: paginatedDataRef }],
		properties: {
			items: {
				type: 'array',
				items: itemSchema,
			},
		},
	});
};
