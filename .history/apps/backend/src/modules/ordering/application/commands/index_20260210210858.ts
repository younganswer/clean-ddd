import { AttachPaymentToOrderHandler } from './handlers/attach-payment-to-order.handler';
import { CreateOrderHandler } from './handlers/create-order.handler';
import { MarkOrderPaidHandler } from './handlers/mark-order-paid.handler';

export const CommandHandlers = [
  CreateOrderHandler,
  AttachPaymentToOrderHandler,
  MarkOrderPaidHandler,
];
