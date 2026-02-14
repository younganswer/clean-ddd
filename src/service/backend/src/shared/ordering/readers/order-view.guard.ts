import type { OrderView } from './order.view';

export const isOrderView = (value: unknown): value is OrderView => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.orderId === 'string' &&
    typeof record.amount === 'number' &&
    typeof record.currency === 'string' &&
    Array.isArray(record.items)
  );
};

export function assertOrderView(value: unknown): asserts value is OrderView {
  if (!isOrderView(value)) {
    throw new Error('order not found');
  }
}
