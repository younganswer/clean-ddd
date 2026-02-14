import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mikroOrmConfigForRuntime } from '@/lib/database/mikro-orm.config';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRoot({
      ...mikroOrmConfigForRuntime(),
      registerRequestContext: true,
    }),
  ],
})
export class DatabaseModule {}
