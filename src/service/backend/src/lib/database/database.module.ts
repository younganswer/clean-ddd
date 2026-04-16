import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfigForRuntime } from '@/lib/database/mikro-orm.config';
import { UnitOfWork } from '@/lib/database/unit-of-work';

const DatabaseImports = [
	MikroOrmModule.forRoot({
		...mikroOrmConfigForRuntime(),
		registerRequestContext: true,
	}),
];

const DatabaseProviders = [UnitOfWork];

const DatabaseExports = [UnitOfWork];

@Global()
@Module({
	imports: DatabaseImports,
	providers: DatabaseProviders,
	exports: DatabaseExports,
})
export class DatabaseModule {}
