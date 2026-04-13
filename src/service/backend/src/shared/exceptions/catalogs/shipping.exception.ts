import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class ShippingException extends BaseException {
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

export class ShippingOrderIdRequiredException extends ShippingException {
	static readonly code = 'SHIPMENT_ORDER_ID_REQUIRED';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly message = 'orderId is required';
}

export class ShippingNotFoundException extends ShippingException {
	static readonly code = 'SHIPMENT_NOT_FOUND';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly message = 'shipment not found';
}

export class ShippingEventPayloadInvalidException extends ShippingException {
	static readonly code = 'SHIPPING_EVENT_PAYLOAD_INVALID';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly message = 'invalid shipping payload';
}
