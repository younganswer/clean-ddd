import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class PaymentException extends BaseException {
	static readonly factoryScoped = true as const;
	static readonly status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code: string = 'UNEXPECTED_ERROR';

	constructor(scope: ExceptionScope, options?: BaseExceptionOptions) {
		const { response, status, code } =
			resolveFactoryScopedExceptionMetadata(
				new.target as FactoryScopedExceptionMetadata,
			);
		super(response, status, code, scope, options);
	}
}

export class PaymentMarkSucceededInvalidStatusException extends PaymentException {
	static readonly response =
		'cannot mark payment succeeded when status is invalid';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'PAYMENT_MARK_SUCCEEDED_INVALID_STATUS';
}

export class PaymentMarkFailedInvalidStatusException extends PaymentException {
	static readonly response =
		'cannot mark payment failed when status is invalid';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'PAYMENT_MARK_FAILED_INVALID_STATUS';
}

export class PaymentOrderIdRequiredException extends PaymentException {
	static readonly response = 'orderId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'PAYMENT_ORDER_ID_REQUIRED';
}

export class PaymentResultInvalidException extends PaymentException {
	static readonly response = 'invalid payment result';
	static readonly status = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code = 'PAYMENT_RESULT_INVALID';
}

export class PaymentIntentResultInvalidException extends PaymentException {
	static readonly response = 'invalid payment intent result';
	static readonly status = HttpStatus.INTERNAL_SERVER_ERROR;
	static readonly code = 'PAYMENT_INTENT_RESULT_INVALID';
}

export class PaymentWebhookPayloadInvalidException extends PaymentException {
	static readonly response = 'invalid webhook payload';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'PAYMENT_WEBHOOK_PAYLOAD_INVALID';
}

export class PaymentNotFoundException extends PaymentException {
	static readonly response = 'payment not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'PAYMENT_NOT_FOUND';
}

export class PaymentApplicationOrderItemsRequiredForInventoryReservationException extends PaymentException {
	static readonly response =
		'cannot request inventory reservation without order items';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION';
}
