import { HttpStatus } from '@nestjs/common';
import {
	BaseException,
	BaseExceptionOptions,
	FactoryScopedExceptionMetadata,
	resolveFactoryScopedExceptionMetadata,
} from '@/common/exceptions/base.exception';
import { ExceptionScope } from '@/common/exceptions/exception-scope.enum';

export class InventoryException extends BaseException {
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

export class InventoryQuantityInvalidException extends InventoryException {
	static readonly response = 'quantity must be positive';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_QUANTITY_INVALID';
}

export class InventoryStockInsufficientException extends InventoryException {
	static readonly response = 'insufficient stock';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'INVENTORY_STOCK_INSUFFICIENT';
}

export class InventoryReleaseQuantityExceedsReservedException extends InventoryException {
	static readonly response = 'release quantity exceeds reserved quantity';
	static readonly status = HttpStatus.CONFLICT;
	static readonly code = 'INVENTORY_RELEASE_QUANTITY_EXCEEDS_RESERVED';
}

export class InventoryReservationOrderIdRequiredException extends InventoryException {
	static readonly response = 'orderId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_RESERVATION_ORDER_ID_REQUIRED';
}

export class InventoryReservationSkuRequiredException extends InventoryException {
	static readonly response = 'sku is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_RESERVATION_SKU_REQUIRED';
}

export class InventoryReservationQuantityInvalidException extends InventoryException {
	static readonly response = 'quantity must be a positive number';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_RESERVATION_QUANTITY_INVALID';
}

export class InventoryReservationIdRequiredException extends InventoryException {
	static readonly response = 'reservation uuid is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_RESERVATION_ID_REQUIRED';
}

export class InventoryOrderIdRequiredException extends InventoryException {
	static readonly response = 'orderId is required';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_ORDER_ID_REQUIRED';
}

export class InventoryReserveItemsInvalidException extends InventoryException {
	static readonly response = 'invalid reserve items';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_RESERVE_ITEMS_INVALID';
}

export class InventoryItemNotFoundException extends InventoryException {
	static readonly response = 'inventory item not found';
	static readonly status = HttpStatus.NOT_FOUND;
	static readonly code = 'INVENTORY_ITEM_NOT_FOUND';
}

export class InventoryEventPayloadInvalidException extends InventoryException {
	static readonly response = 'invalid inventory payload';
	static readonly status = HttpStatus.BAD_REQUEST;
	static readonly code = 'INVENTORY_EVENT_PAYLOAD_INVALID';
}
