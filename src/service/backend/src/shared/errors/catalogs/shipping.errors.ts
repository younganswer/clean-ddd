import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const SHIPPING_DOMAIN_ERRORS = {
	SHIPMENT_ORDER_ID_REQUIRED: {
		code: 'SHIPMENT_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const SHIPPING_APPLICATION_ERRORS = {
	SHIPMENT_ORDER_ID_REQUIRED: {
		code: 'SHIPMENT_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	SHIPPING_EVENT_PAYLOAD_INVALID: {
		code: 'SHIPPING_EVENT_PAYLOAD_INVALID',
		message: 'invalid shipping payload',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;
