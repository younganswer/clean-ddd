import { MikroORM, RequestContext } from '@mikro-orm/core';

export abstract class MikroOrmCronJobAbstract {
	constructor(protected readonly orm: MikroORM) {}

	protected abstract handleJobWithContext(): Promise<void>;

	protected async runWithRequestContext(): Promise<void> {
		await RequestContext.create(this.orm.em.fork(), async () => {
			await this.handleJobWithContext();
		});
	}
}
