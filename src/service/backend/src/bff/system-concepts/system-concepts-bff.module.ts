import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SystemConceptsBffController } from '@/bff/system-concepts/presentation/system-concepts-bff.controller';

@Module({
	imports: [CqrsModule],
	controllers: [SystemConceptsBffController],
})
export class SystemConceptsBffModule {}
