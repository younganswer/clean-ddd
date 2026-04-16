import { Inject, Injectable } from '@nestjs/common';
import {
	IInventoryItemRepositorySymbol,
	type IInventoryItemRepository,
} from '@/modules/inventory/domain/repositories/i.inventory-item.repository';
import {
	IInventoryReservationRepositorySymbol,
	type IInventoryReservationRepository,
} from '@/modules/inventory/domain/repositories/i.inventory-reservation.repository';
import { InventoryItem } from '@/modules/inventory/domain/entities/inventory-item.entity';
import { InventoryReservation } from '@/modules/inventory/domain/entities/inventory-reservation.entity';
import {
	InventoryItemNotFoundException,
	InventoryOrderIdRequiredException,
	InventoryReserveItemsInvalidException,
} from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';

@Injectable()
export class InventoryReservationService {
	constructor(
		@Inject(IInventoryItemRepositorySymbol)
		private readonly inventoryItemRepository: IInventoryItemRepository,
		@Inject(IInventoryReservationRepositorySymbol)
		private readonly reservations: IInventoryReservationRepository,
	) {}

	private normalizeOrderId(orderIdValue: unknown): string {
		const orderId =
			typeof orderIdValue === 'string'
				? orderIdValue.trim()
				: typeof orderIdValue === 'number' ||
					  typeof orderIdValue === 'bigint' ||
					  typeof orderIdValue === 'boolean'
					? String(orderIdValue).trim()
					: '';
		if (!orderId) {
			throw DomainExceptionFactory.create(
				InventoryOrderIdRequiredException,
			);
		}

		return orderId;
	}

	private buildRequestedBySku(
		items: Array<{ sku: string; quantity: number }> | undefined,
	): Map<string, number> {
		const requestedBySku = new Map<string, number>();
		for (const requested of items ?? []) {
			const sku = String(requested.sku ?? '').trim();
			const quantity = Number(requested.quantity ?? 0);
			if (!sku || !Number.isFinite(quantity) || quantity <= 0) {
				throw DomainExceptionFactory.create(
					InventoryReserveItemsInvalidException,
					{
						cause: { requested },
					},
				);
			}

			const current = requestedBySku.get(sku) ?? 0;
			requestedBySku.set(sku, current + quantity);
		}

		if (requestedBySku.size === 0) {
			throw DomainExceptionFactory.create(
				InventoryReserveItemsInvalidException,
			);
		}

		return requestedBySku;
	}

	private async loadAlreadyReservedSkus(
		orderId: string,
	): Promise<Set<string>> {
		const existingReservations =
			await this.reservations.findReservationsByOrderId(orderId);
		return new Set(
			existingReservations.map((reservation) => reservation.sku),
		);
	}

	private async collectReserveTargets(
		orderId: string,
		requestedBySku: Map<string, number>,
		alreadyReservedSkus: Set<string>,
	): Promise<{
		stocksToPersist: InventoryItem[];
		reservationsToPersist: InventoryReservation[];
	}> {
		const stocksToPersist: InventoryItem[] = [];
		const reservationsToPersist: InventoryReservation[] = [];

		for (const [sku, quantity] of requestedBySku.entries()) {
			if (alreadyReservedSkus.has(sku)) {
				continue;
			}

			const stock = await this.inventoryItemRepository.findBySku(sku);
			if (!stock) {
				throw DomainExceptionFactory.create(
					InventoryItemNotFoundException,
					{
						cause: { sku },
						description: `inventory item not found: sku=${sku}`,
					},
				);
			}

			stock.reserve(quantity);
			stocksToPersist.push(stock);
			reservationsToPersist.push(
				InventoryReservation.create({
					orderId,
					sku,
					quantity,
				}),
			);
		}

		return {
			stocksToPersist,
			reservationsToPersist,
		};
	}

	private async persistReserveTargets(
		stocksToPersist: InventoryItem[],
		reservationsToPersist: InventoryReservation[],
	): Promise<void> {
		for (const stock of stocksToPersist) {
			await this.inventoryItemRepository.persist(stock);
		}

		for (const reservation of reservationsToPersist) {
			await this.reservations.persist(reservation);
		}
	}

	async reserve(input: {
		orderId: string;
		items: Array<{ sku: string; quantity: number }>;
	}): Promise<void> {
		const orderId = this.normalizeOrderId(input.orderId);

		await this.inventoryItemRepository.seedIfEmpty();

		const requestedBySku = this.buildRequestedBySku(input.items);
		const alreadyReservedSkus = await this.loadAlreadyReservedSkus(orderId);
		const { stocksToPersist, reservationsToPersist } =
			await this.collectReserveTargets(
				orderId,
				requestedBySku,
				alreadyReservedSkus,
			);

		await this.persistReserveTargets(
			stocksToPersist,
			reservationsToPersist,
		);
	}

	async releaseForOrder(input: { orderId: string }): Promise<void> {
		const orderId = String(input.orderId ?? '').trim();
		if (!orderId) {
			throw DomainExceptionFactory.create(
				InventoryOrderIdRequiredException,
			);
		}

		const existingReservations =
			await this.reservations.findReservationsByOrderId(orderId);
		if (!existingReservations.length) {
			return;
		}

		for (const reservation of existingReservations) {
			const stock = await this.inventoryItemRepository.findBySku(
				reservation.sku,
			);
			if (!stock) {
				throw DomainExceptionFactory.create(
					InventoryItemNotFoundException,
					{
						cause: {
							sku: reservation.sku,
							orderId,
						},
						description: `inventory item not found: sku=${reservation.sku}`,
					},
				);
			}

			stock.release(reservation.quantity);
			await this.inventoryItemRepository.persist(stock);
			await this.reservations.delete(reservation);
		}
	}
}
