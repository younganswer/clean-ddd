export const INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE =
  'INVENTORY.RESERVE_FOR_ORDER' as const;

export type InventoryOrderItemPayload = { sku: string; quantity: number };

export class ReserveInventoryForOrderRequestedEvent {
  static readonly eventType = INVENTORY_RESERVE_FOR_ORDER_REQUESTED_EVENT_TYPE;

  constructor(
    public readonly orderId: string,
    public readonly items: InventoryOrderItemPayload[],
  ) {}
}
