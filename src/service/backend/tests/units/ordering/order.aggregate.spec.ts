import { given, then, when } from 'test-utils/gwt.template.spec';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

describe('Order aggregate', () => {
	const userId = '00000000-0000-0000-0000-000000000001';

	given('신규 주문을 생성하면', () => {
		when('Order.create를 호출하면', () => {
			const now = new Date('2026-02-10T00:00:00.000Z');
			const order = Order.create({
				userId,
				total: Money.of(100, 'krw'),
				items: [OrderItem.of('SKU-001', 1)],
				now,
			});

			then('결제 대기 상태로 생성됩니다', () => {
				expect(order.uuid).toBeDefined();
				expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
				expect(order.paymentId).toBeNull();
				expect(order.orderedAt).toBeInstanceOf(Date);
				expect(order.paidAt).toBeNull();
			});
		});
	});

	given('결제ID를 연결할 때', () => {
		when('paymentId가 비어있으면', () => {
			then('예외가 발생합니다', () => {
				const order = Order.create({
					userId,
					total: Money.of(100, 'KRW'),
					items: [OrderItem.of('SKU-001', 1)],
				});
				expect(() => order.attachPayment('')).toThrow(
					'paymentId is required',
				);
			});
		});

		when('paymentId가 유효하면', () => {
			const order = Order.create({
				userId,
				total: Money.of(100, 'KRW'),
				items: [OrderItem.of('SKU-001', 1)],
			});
			order.attachPayment(' pay-1 ');

			then('paymentId가 trim되어 저장됩니다', () => {
				expect(order.paymentId).toBe('pay-1');
			});
		});
	});

	given('주문을 결제완료 처리하면', () => {
		when('markPaid를 호출하면', () => {
			const order = Order.create({
				userId,
				total: Money.of(100, 'KRW'),
				items: [OrderItem.of('SKU-001', 1)],
			});

			order.markPaid();

			then('상태가 PAID로 변경되고 paidAt이 설정됩니다', () => {
				expect(order.status).toBe(OrderStatus.PAID);
				expect(order.paidAt).not.toBeNull();
			});
		});
	});
});
