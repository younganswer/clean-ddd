import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CheckoutBffController } from '@/bff/checkout/presentation/checkout-bff.controller';
import { CheckoutBffCommandHandlers } from '@/bff/checkout/application/commands';

const CheckoutBffImports = [CqrsModule];

const CheckoutBffControllers = [CheckoutBffController];

const CheckoutBffProviders = [...CheckoutBffCommandHandlers];

@Module({
	imports: CheckoutBffImports,
	controllers: CheckoutBffControllers,
	providers: CheckoutBffProviders,
})
export class CheckoutBffModule {}
