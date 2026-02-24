import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfigForRuntime } from '@/lib/database/mikro-orm.config';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@Global()
@Module({
	imports: [
		MikroOrmModule.forRoot({
			...mikroOrmConfigForRuntime(),
			registerRequestContext: true,
		}),
	],
	providers: [UnitOfWork],
	exports: [UnitOfWork],
})
export class DatabaseModule {}
