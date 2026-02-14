import { given, then, when } from 'test-utils/gwt.template.spec';
import { Order } from 'src/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from 'src/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from 'src/modules/ordering/domains/value-objects/order-item.vo';
import { OrderStatus } from 'src/shared/ordering/enums/order-status.enum';

describe('Order aggregate', () => {
  const userId = '00000000-0000-0000-0000-000000000001';

  given('신규 주문을 생성하면', () => {
    when('Order.createNew를 호출하면', () => {
      const now = new Date('2026-02-10T00:00:00.000Z');
      const order = Order.createNew({
        id: 'order-1',
        userId,
        total: Money.of(100, 'krw'),
        items: [OrderItem.of('SKU-001', 1)],
        now,
      });

      then('결제 대기 상태로 생성됩니다', () => {
        expect(order.id).toBe('order-1');
        expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
        expect(order.paymentId).toBeNull();
        expect(order.createdAt.toISOString()).toBe(now.toISOString());
        expect(order.updatedAt.toISOString()).toBe(now.toISOString());
      });
    });
  });

  given('결제ID를 연결할 때', () => {
    when('paymentId가 비어있으면', () => {
      then('예외가 발생합니다', () => {
        const order = Order.createNew({
          id: 'order-1',
          userId,
          total: Money.of(100, 'KRW'),
          items: [OrderItem.of('SKU-001', 1)],
        });
        expect(() => order.attachPayment('')).toThrow('paymentId is required');
      });
    });

    when('paymentId가 유효하면', () => {
      const now = new Date('2026-02-10T01:00:00.000Z');
      const order = Order.createNew({
        id: 'order-1',
        userId,
        total: Money.of(100, 'KRW'),
        items: [OrderItem.of('SKU-001', 1)],
        now: new Date('2026-02-10T00:00:00.000Z'),
      });
      order.attachPayment(' pay-1 ', now);

      then('paymentId가 trim되어 저장되고 updatedAt이 갱신됩니다', () => {
        expect(order.paymentId).toBe('pay-1');
        expect(order.updatedAt.toISOString()).toBe(now.toISOString());
      });
    });
  });

  given('주문을 결제완료 처리하면', () => {
    when('markPaid를 호출하면', () => {
      const now = new Date('2026-02-10T02:00:00.000Z');
      const order = Order.createNew({
        id: 'order-1',
        userId,
        total: Money.of(100, 'KRW'),
        items: [OrderItem.of('SKU-001', 1)],
      });
      order.markPaid(now);

      then('상태가 PAID로 변경되고 updatedAt이 갱신됩니다', () => {
        expect(order.status).toBe(OrderStatus.PAID);
        expect(order.updatedAt.toISOString()).toBe(now.toISOString());
      });
    });
  });
});
