import { given, then, when } from 'test-utils/gwt.template.spec';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createTestOrm } from 'test-utils/db/test-orm';
import { OrderRepository } from '@/modules/ordering/infrastructure/repositories/order.repository';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from '@/modules/ordering/infrastructure/schemas/order.schema';
import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';

const describeDb = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeDb('OrderRepository (DB)', () => {
	const userId = '00000000-0000-0000-0000-000000000001';

	let em: EntityManager;
	let repo: OrderRepository;
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

			beforeEach(() => {
				const created = repo.create({
					userId,
					amount: 100,
					currency: 'KRW',
					items: [{ sku: 'SKU-001', quantity: 1 }],
				});
				orderId = created.uuid;
			});

			then('DB에 저장되고 조회 가능합니다', (done: jest.DoneCallback) => {
				void (async () => {
					try {
						const found = await repo.findById(orderId);
						expect(found).not.toBeNull();
						expect(found?.uuid).toBe(orderId);
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
				const created = repo.create({
					userId,
					amount: 100,
					currency: 'KRW',
				});
				orderId = created.uuid;
				await repo.attachPayment(
					orderId,
					'00000000-0000-0000-0000-000000000001',
				);
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
				const created = repo.create({
					userId,
					amount: 100,
					currency: 'KRW',
				});
				orderId = created.uuid;
				await repo.markPaid(orderId);
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
