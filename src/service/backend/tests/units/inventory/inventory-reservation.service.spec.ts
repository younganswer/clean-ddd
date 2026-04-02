import { InventoryItem } from '@/modules/inventory/domains/entities/inventory-item.entity';
import { InventoryReservation } from '@/modules/inventory/domains/entities/inventory-reservation.entity';
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
			delete: jest.fn(() => Promise.resolve()),
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

	it('releases reserved stock and removes reservations for an order', async () => {
		const stockA = InventoryItem.rehydrate({
			uuid: 'item-a',
			sku: 'SKU-A',
			priceCurrency: 'USD',
			priceAmountMinor: 100,
			availableQuantity: 5,
			reservedQuantity: 5,
		});
		const stockB = InventoryItem.rehydrate({
			uuid: 'item-b',
			sku: 'SKU-B',
			priceCurrency: 'USD',
			priceAmountMinor: 200,
			availableQuantity: 0,
			reservedQuantity: 4,
		});

		const persistInventoryItem = jest.fn(() => Promise.resolve());
		const findInventoryItemBySku = jest.fn((sku: string) =>
			Promise.resolve(
				sku === 'SKU-A' ? stockA : sku === 'SKU-B' ? stockB : null,
			),
		);

		const itemRepository: IInventoryItemRepository = {
			seedIfEmpty: jest.fn(() => Promise.resolve()),
			persist: persistInventoryItem,
			findRecent: jest.fn(() => Promise.resolve([])),
			findBySku: findInventoryItemBySku,
			countItems: jest.fn(() => Promise.resolve(2)),
		};

		const deleteReservation = jest.fn(() => Promise.resolve());
		const reservationRepository: IInventoryReservationRepository = {
			persist: jest.fn(() => Promise.resolve()),
			findReservationsByOrderId: jest.fn(() =>
				Promise.resolve([
					InventoryReservation.rehydrate({
						uuid: 'res-1',
						orderId: 'order-1',
						sku: 'SKU-A',
						quantity: 3,
					}),
					InventoryReservation.rehydrate({
						uuid: 'res-2',
						orderId: 'order-1',
						sku: 'SKU-B',
						quantity: 4,
					}),
				]),
			),
			findByOrderAndSku: jest.fn(() => Promise.resolve(null)),
			delete: deleteReservation,
		};

		const service = new InventoryReservationService(
			itemRepository,
			reservationRepository,
		);

		await service.releaseForOrder({ orderId: 'order-1' });

		expect(findInventoryItemBySku).toHaveBeenCalledTimes(2);
		expect(persistInventoryItem).toHaveBeenCalledTimes(2);
		expect(deleteReservation).toHaveBeenCalledTimes(2);
		expect(deleteReservation).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				orderId: 'order-1',
				sku: 'SKU-A',
				quantity: 3,
			}),
		);
		expect(deleteReservation).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				orderId: 'order-1',
				sku: 'SKU-B',
				quantity: 4,
			}),
		);

		expect(stockA.availableQuantity).toBe(8);
		expect(stockA.reservedQuantity).toBe(2);
		expect(stockB.availableQuantity).toBe(4);
		expect(stockB.reservedQuantity).toBe(0);
	});
});
