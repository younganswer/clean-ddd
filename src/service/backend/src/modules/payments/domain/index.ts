import { PaymentsHandlers } from '@/modules/payments/application';
import { PaymentIntentMapper } from '@/modules/payments/infrastructure/mappers/payment-intent.mapper';
import { PaymentIntentReaderProvider } from '@/modules/payments/infrastructure/readers/payment-intent.reader';
import { PaymentRepositoryProviders } from '@/modules/payments/infrastructure/repositories/payment.repository';

export const PaymentsProviders = [
	PaymentIntentMapper,
	...PaymentRepositoryProviders,
	PaymentIntentReaderProvider,
	...PaymentsHandlers,
];
