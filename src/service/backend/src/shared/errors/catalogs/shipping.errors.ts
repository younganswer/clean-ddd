import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/common/errors/error-template.type';

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
	SHIPMENT_NOT_FOUND: {
		code: 'SHIPMENT_NOT_FOUND',
		message: 'shipment not found',
		status: HttpStatus.NOT_FOUND,
	},
	SHIPPING_EVENT_PAYLOAD_INVALID: {
		code: 'SHIPPING_EVENT_PAYLOAD_INVALID',
		message: 'invalid shipping payload',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;
