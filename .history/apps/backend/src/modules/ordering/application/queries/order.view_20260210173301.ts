import type { OrderStatus } from '../../domains/order-status';

export type OrderItemView = {
  sku: string;
  quantity: number;
};

export type OrderView = {
  orderId: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  items: OrderItemView[];
  paymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};
