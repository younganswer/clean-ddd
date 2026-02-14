import { given, then, when } from 'test-utils/gwt.template.spec';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';

describe('OrderItem', () => {
  given('유효한 SKU와 수량이 주어지면', () => {
    when('OrderItem.of를 호출하면', () => {
      const item = OrderItem.of(' SKU-001 ', 2);

      then('SKU는 trim되고 수량은 유지됩니다', () => {
        expect(item.sku).toBe('SKU-001');
        expect(item.quantity).toBe(2);
      });
    });
  });

  given('SKU가 비어있으면', () => {
    when('OrderItem.of를 호출하면', () => {
      then('예외가 발생합니다', () => {
        expect(() => OrderItem.of('  ', 1)).toThrow('sku is required');
      });
    });
  });

  given('수량이 0 이하이면', () => {
    when('OrderItem.of를 호출하면', () => {
      then('예외가 발생합니다', () => {
        expect(() => OrderItem.of('SKU-001', 0)).toThrow(
          'quantity must be a positive number',
        );
      });
    });
  });
});
