import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class OrderingException extends BaseException {
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

export class OrderingUserIdRequiredException extends OrderingException {
	static readonly response = 'userId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_USER_ID_REQUIRED';
}

export class OrderingItemsRequiredException extends OrderingException {
	static readonly response = 'order must contain at least one item';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_ITEMS_REQUIRED';
}

export class OrderingPaymentIdRequiredException extends OrderingException {
	static readonly response = 'paymentId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_PAYMENT_ID_REQUIRED';
}

export class OrderingPaymentAlreadyAttachedException extends OrderingException {
	static readonly response = 'paymentId is already attached';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'ORDERING_PAYMENT_ALREADY_ATTACHED';
}

export class OrderingPaymentAttachInvalidStatusException extends OrderingException {
	static readonly response = 'cannot attach payment in current status';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'ORDERING_PAYMENT_ATTACH_INVALID_STATUS';
}

export class OrderingMarkPaidInvalidStatusException extends OrderingException {
	static readonly response = 'cannot mark paid in current status';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'ORDERING_MARK_PAID_INVALID_STATUS';
}

export class OrderingPaymentNotAttachedException extends OrderingException {
	static readonly response = 'cannot mark paid before payment is attached';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'ORDERING_PAYMENT_NOT_ATTACHED';
}

export class OrderingMoneyAmountInvalidException extends OrderingException {
	static readonly response = 'amount must be a positive number';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_MONEY_AMOUNT_INVALID';
}

export class OrderingMoneyCurrencyRequiredException extends OrderingException {
	static readonly response = 'currency is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_MONEY_CURRENCY_REQUIRED';
}

export class OrderingItemSkuRequiredException extends OrderingException {
	static readonly response = 'sku is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_ITEM_SKU_REQUIRED';
}

export class OrderingItemQuantityInvalidException extends OrderingException {
	static readonly response = 'quantity must be a positive number';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_ITEM_QUANTITY_INVALID';
}

export class OrderingOrderIdRequiredException extends OrderingException {
	static readonly response = 'orderId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'ORDERING_ID_REQUIRED';
}

export class OrderingOrderNotFoundException extends OrderingException {
	static readonly response = 'order not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'ORDERING_NOT_FOUND';
}
