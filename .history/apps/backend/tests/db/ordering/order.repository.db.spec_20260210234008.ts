import { given, then, when } from 'test-utils/gwt.template.spec';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createTestOrm } from 'test-utils/db/test-orm';
import { OrderRepository } from 'src/modules/ordering/infrastructure/repositories/order.repository';
import { OrderMapper } from 'src/modules/ordering/infrastructure/mappers/order.mapper';
import { OrderSchema } from 'src/modules/ordering/infrastructure/schemas/order.schema';
import { OrderStatus } from 'src/shared/ordering/enums/order-status.enum';

const describeDb = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeDb('OrderRepository (DB)', () => {
  let em: EntityManager;
  let repo: OrderRepository;
  let closeOrm: (() => Promise<void>) | null = null;

  beforeAll(async () => {
    const orm = await createTestOrm();
    closeOrm = async () => {
      await orm.close(true);
    };

    em = orm.em as unknown as EntityManager;
    repo = new OrderRepository(em, new OrderMapper());
  });

  afterAll(async () => {
    await closeOrm?.();
  });

  beforeEach(async () => {
    await em.nativeDelete(OrderSchema, {});
  });

  given('주문을 생성하면', () => {
    when('create를 호출하면', () => {
      let orderId: string;

      beforeEach(async () => {
        const created = await repo.create({
          amount: 100,
          currency: 'KRW',
          items: [{ sku: 'SKU-001', quantity: 1 }],
        });
        orderId = created.id;
      });

      then('DB에 저장되고 조회 가능합니다', (done) => {
        repo
          .findById(orderId)
          .then((found) => {
            expect(found).not.toBeNull();
            expect(found?.id).toBe(orderId);
            expect(found?.status).toBe(OrderStatus.PENDING_PAYMENT);
            expect(found?.amount).toBe(100);
            expect(found?.currency).toBe('KRW');
            done();
          })
          .catch(done);
      });
    });
  });

  given('결제ID를 연결하면', () => {
    when('attachPayment를 호출하면', () => {
      let orderId: string;

      beforeEach(async () => {
        const created = await repo.create({ amount: 100, currency: 'KRW' });
        orderId = created.id;
        await repo.attachPayment(orderId, 'pay-1');
      });

      then('paymentId가 저장됩니다', (done) => {
        repo
          .findById(orderId)
          .then((found) => {
            expect(found?.paymentId).toBe('pay-1');
            done();
          })
          .catch(done);
      });
    });
  });

  given('주문을 결제완료 처리하면', () => {
    when('markPaid를 호출하면', () => {
      let orderId: string;

      beforeEach(async () => {
        const created = await repo.create({ amount: 100, currency: 'KRW' });
        orderId = created.id;
        await repo.markPaid(orderId);
      });

      then('상태가 PAID로 변경됩니다', (done) => {
        repo
          .findById(orderId)
          .then((found) => {
            expect(found?.status).toBe(OrderStatus.PAID);
            done();
          })
          .catch(done);
      });
    });
  });
});
