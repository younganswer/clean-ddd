import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryReservationService } from '@/modules/inventory/domains/services/inventory-reservation.service';
import type { IInventoryItemRepository } from '@/modules/inventory/domains/repositories/i.inventory-item.repository';
import type { IInventoryReservationRepository } from '@/modules/inventory/domains/repositories/i.inventory-reservation.repository';

describe('InventoryReservationService', () => {
	it('aggregates duplicate sku requests and persists once per sku', async () => {
		const stock = InventoryItem.rehydrate({
			uuid: 'item-1',
			sku: 'SKU-001',
			priceCurrency: 'USD',
			priceAmountMinor: 100,
			availableQuantity: 10,
			reservedQuantity: 0,
		});

		const persistInventoryItem = jest.fn(() => Promise.resolve());
		const findInventoryItemBySku = jest.fn((sku: string) =>
			Promise.resolve(sku === 'SKU-001' ? stock : null),
		);

		const itemRepository: IInventoryItemRepository = {
			seedIfEmpty: jest.fn(() => Promise.resolve()),
			persist: persistInventoryItem,
			findRecent: jest.fn(() => Promise.resolve([])),
			findBySku: findInventoryItemBySku,
			countItems: jest.fn(() => Promise.resolve(1)),
		};

		const persistReservation = jest.fn(() => Promise.resolve());

		const reservationRepository: IInventoryReservationRepository = {
			persist: persistReservation,
			findReservationsByOrderId: jest.fn(() => Promise.resolve([])),
			findByOrderAndSku: jest.fn(() => Promise.resolve(null)),
		};

		const service = new InventoryReservationService(
			itemRepository,
			reservationRepository,
		);

		await service.reserve({
			orderId: 'order-1',
			items: [
				{ sku: 'SKU-001', quantity: 2 },
				{ sku: 'SKU-001', quantity: 3 },
			],
		});

		expect(findInventoryItemBySku).toHaveBeenCalledTimes(1);
		expect(persistInventoryItem).toHaveBeenCalledTimes(1);
		expect(persistReservation).toHaveBeenCalledTimes(1);
		expect(stock.availableQuantity).toBe(5);
		expect(stock.reservedQuantity).toBe(5);
	});
});
