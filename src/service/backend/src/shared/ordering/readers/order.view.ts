import type { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

export type OrderItemView = {
  sku: string;
  quantity: number;
};

export type OrderView = {
  orderId: string;
  userId: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  items: OrderItemView[];
  paymentId: string | null;
  createdAt: string;
  updatedAt: string;
};
