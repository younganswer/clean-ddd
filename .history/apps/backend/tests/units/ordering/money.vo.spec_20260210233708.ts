import { given, then, when } from 'test-utils/gwt.template.spec';
import { Money } from 'src/modules/ordering/domains/value-objects/money.vo';

describe('Money', () => {
  given('유효한 금액과 통화가 주어지면', () => {
    when('Money.of를 호출하면', () => {
      const money = Money.of(1000, 'krw');

      then('금액과 통화가 정규화되어 생성됩니다', () => {
        expect(money.amount).toBe(1000);
        expect(money.currency).toBe('KRW');
      });
    });
  });

  given('금액이 0 이하이면', () => {
    when('Money.of를 호출하면', () => {
      then('예외가 발생합니다', () => {
        expect(() => Money.of(0, 'KRW')).toThrow(
          'amount must be a positive number',
        );
      });
    });
  });

  given('통화가 비어있으면', () => {
    when('Money.of를 호출하면', () => {
      then('예외가 발생합니다', () => {
        expect(() => Money.of(100, '')).toThrow('currency is required');
      });
    });
  });
});
