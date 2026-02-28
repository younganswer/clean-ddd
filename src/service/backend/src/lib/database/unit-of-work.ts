import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

type UnitOfWorkStore = {
	readonly em: EntityManager;
	depth: number;
};

const unitOfWorkStorage = new AsyncLocalStorage<UnitOfWorkStore>();

@Injectable()
export class UnitOfWork {
	constructor(private readonly rootEm: EntityManager) {}

	/**
	 * Runs work inside a transaction boundary.
	 *
	 * - Outermost call starts a DB transaction and guarantees a single flush at the end.
	 * - Nested calls reuse the same transactional EntityManager and do NOT flush.
	 */
	async transaction<T>(work: (em: EntityManager) => Promise<T>): Promise<T> {
		const existing = unitOfWorkStorage.getStore();
		if (existing) {
			existing.depth += 1;
			try {
				return await work(existing.em);
			} finally {
				existing.depth -= 1;
			}
		}

		return await this.rootEm.transactional(async (tx) => {
			return await RequestContext.create(tx, async () => {
				return await unitOfWorkStorage.run(
					{ em: tx, depth: 1 },
					async () => {
						const result = await work(tx);
						await tx.flush();
						return result;
					},
				);
			});
		});
	}

	/** Returns the current transactional EntityManager if inside UnitOfWork.transaction(). */
	emForUnitOfWork(): EntityManager {
		return unitOfWorkStorage.getStore()?.em ?? this.rootEm;
	}
}
