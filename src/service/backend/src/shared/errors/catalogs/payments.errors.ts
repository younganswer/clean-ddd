import { HttpStatus } from '@nestjs/common';
import { ErrorTemplate } from '@/shared/errors/error-template.type';

export const PAYMENTS_DOMAIN_ERRORS = {
	PAYMENT_MARK_SUCCEEDED_INVALID_STATUS: {
		code: 'PAYMENT_MARK_SUCCEEDED_INVALID_STATUS',
		message: 'cannot mark payment succeeded when status is invalid',
		status: HttpStatus.CONFLICT,
	},
	PAYMENT_MARK_FAILED_INVALID_STATUS: {
		code: 'PAYMENT_MARK_FAILED_INVALID_STATUS',
		message: 'cannot mark payment failed when status is invalid',
		status: HttpStatus.CONFLICT,
	},
} as const satisfies Record<string, ErrorTemplate>;

export const PAYMENTS_APPLICATION_ERRORS = {
	PAYMENT_ORDER_ID_REQUIRED: {
		code: 'PAYMENT_ORDER_ID_REQUIRED',
		message: 'orderId is required',
		status: HttpStatus.BAD_REQUEST,
	},
	PAYMENT_WEBHOOK_PAYLOAD_INVALID: {
		code: 'PAYMENT_WEBHOOK_PAYLOAD_INVALID',
		message: 'invalid webhook payload',
		status: HttpStatus.BAD_REQUEST,
	},
	PAYMENT_NOT_FOUND: {
		code: 'PAYMENT_NOT_FOUND',
		message: 'payment not found',
		status: HttpStatus.NOT_FOUND,
	},
	ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION: {
		code: 'ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION',
		message: 'cannot request inventory reservation without order items',
		status: HttpStatus.BAD_REQUEST,
	},
} as const satisfies Record<string, ErrorTemplate>;
