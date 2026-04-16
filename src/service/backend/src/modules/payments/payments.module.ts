import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { IPaymentIntentReaderSymbol } from '@/modules/payments/domain/readers/i.payment-intent.reader';
import { PaymentsProviders } from '@/modules/payments/domain';
import { PaymentsControllers } from '@/modules/payments/presentation';

const PaymentsImports = [
	CqrsModule,
	forwardRef(() => OutboxModule),
	OrderingModule,
];

const PaymentsExports = [IPaymentIntentReaderSymbol];

@Module({
	imports: PaymentsImports,
	controllers: PaymentsControllers,
	providers: PaymentsProviders,
	exports: PaymentsExports,
})
export class PaymentsModule {}
