import { AttachPaymentToOrderHandler } from '@/modules/ordering/application/commands/handlers/attach-payment-to-order.handler';
import { CreateOrderHandler } from '@/modules/ordering/application/commands/handlers/create-order.handler';
import { MarkOrderPaidHandler } from '@/modules/ordering/application/commands/handlers/mark-order-paid.handler';

export const CommandHandlers = [
  CreateOrderHandler,
  AttachPaymentToOrderHandler,
  MarkOrderPaidHandler,
];
