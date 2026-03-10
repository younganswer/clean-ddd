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

		const itemRepository: IInventoryItemRepository = {
			seedIfEmpty: jest.fn(() => Promise.resolve()),
			persist: jest.fn(() => Promise.resolve()),
			findAll: jest.fn(() => Promise.resolve([])),
			findBySku: jest.fn((sku: string) =>
				Promise.resolve(sku === 'SKU-001' ? stock : null),
			),
			countItems: jest.fn(() => Promise.resolve(1)),
		};

		const reservationRepository: IInventoryReservationRepository = {
			persist: jest.fn(() => Promise.resolve()),
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

		expect(itemRepository.findBySku).toHaveBeenCalledTimes(1);
		expect(itemRepository.persist).toHaveBeenCalledTimes(1);
		expect(reservationRepository.persist).toHaveBeenCalledTimes(1);
		expect(stock.availableQuantity).toBe(5);
		expect(stock.reservedQuantity).toBe(5);
	});
});
