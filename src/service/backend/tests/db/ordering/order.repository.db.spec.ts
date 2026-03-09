import { given, then, when } from 'test-utils/gwt.template.spec';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createTestOrm } from 'test-utils/db/test-orm';
import { OrderRepository } from '@/modules/ordering/infrastructure/repositories/order.repository';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';
import { Order } from '@/modules/ordering/domains/entities/aggregates/order/order.aggregate';
import { Money } from '@/shared/money/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { UnitOfWork } from '@/lib/database/unit-of-work';

describe('OrderRepository (DB)', () => {
	const userId = '00000000-0000-0000-0000-000000000001';

	let em: EntityManager;
	let repo: OrderRepository;
	let uow: UnitOfWork;
	let closeOrm: (() => Promise<void>) | null = null;
	let forkForTest: (() => void) | null = null;

	beforeAll(async () => {
		const orm = await createTestOrm();
		closeOrm = async () => {
			await orm.close(true);
		};

		// orm.em은 global context이므로, 각 테스트에서 fork된 EM을 사용합니다.
		const rootEm = orm.em as unknown as EntityManager;
		forkForTest = () => {
			em = rootEm.fork() as unknown as EntityManager;
			repo = new OrderRepository(em, new OrderMapper());
			uow = new UnitOfWork(em);
		};
		forkForTest();
	});

	afterAll(async () => {
		await closeOrm?.();
	});

	beforeEach(async () => {
		forkForTest?.();
		await em.nativeDelete(OrderSchema, {});
	});

	given('주문을 생성하면', () => {
		when('create를 호출하면', () => {
			let orderId: string;

			beforeEach(async () => {
				const order = Order.create({
					userId,
					total: Money.of(100, 'KRW'),
					items: [OrderItem.of('SKU-001', 1)],
				});
				await uow.transaction(async () => {
					await repo.persist(order);
				});
				orderId = order.id;
				em.clear();
			});

			then('DB에 저장되고 조회 가능합니다', (done: jest.DoneCallback) => {
				void (async () => {
					try {
						const found = await repo.findById(orderId);
						expect(found).not.toBeNull();
						expect(found?.id).toBe(orderId);
						expect(found?.status).toBe(OrderStatus.PENDING_PAYMENT);
						expect(found?.amount).toBe(100);
						expect(found?.currency).toBe('KRW');
						done();
					} catch (e) {
						done(e as Error);
					}
				})();
			});
		});
	});

	given('결제ID를 연결하면', () => {
		when('attachPayment를 호출하면', () => {
			let orderId: string;

			beforeEach(async () => {
				const order = Order.create({
					userId,
					total: Money.of(100, 'KRW'),
					items: [OrderItem.of('SKU-001', 1)],
				});

				order.attachPayment('00000000-0000-0000-0000-000000000001');
				await uow.transaction(async () => {
					await repo.persist(order);
				});
				orderId = order.id;
			});

			then('paymentId가 저장됩니다', (done: jest.DoneCallback) => {
				void (async () => {
					try {
						const found = await repo.findById(orderId);
						expect(found?.paymentId).toBe(
							'00000000-0000-0000-0000-000000000001',
						);
						done();
					} catch (e) {
						done(e as Error);
					}
				})();
			});
		});
	});

	given('주문을 결제완료 처리하면', () => {
		when('markPaid를 호출하면', () => {
			let orderId: string;

			beforeEach(async () => {
				const order = Order.create({
					userId,
					total: Money.of(100, 'KRW'),
					items: [OrderItem.of('SKU-001', 1)],
				});
				order.attachPayment('00000000-0000-0000-0000-000000000001');
				order.markPaid();
				await uow.transaction(async () => {
					await repo.persist(order);
				});
				orderId = order.id;
			});

			then('상태가 PAID로 변경됩니다', (done: jest.DoneCallback) => {
				void (async () => {
					try {
						const found = await repo.findById(orderId);
						expect(found?.status).toBe(OrderStatus.PAID);
						done();
					} catch (e) {
						done(e as Error);
					}
				})();
			});
		});
	});
});
