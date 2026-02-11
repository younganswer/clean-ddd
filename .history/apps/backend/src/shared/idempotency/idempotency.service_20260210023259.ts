import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ProcessedEventSchema } from './processed-event.schema';

@Injectable()
export class IdempotencyService {
  constructor(private readonly em: EntityManager) {}

  private emForContext(): EntityManager {
    return (
      (RequestContext.getEntityManager() as EntityManager | undefined) ??
      this.em
    );
  }

  async claim(consumerName: string, eventId: string): Promise<boolean> {
    try {
      const em = this.emForContext();
      const row = em.create(ProcessedEventSchema, {
        consumerName,
        eventId,
        processedAt: new Date(),
      });
      await em.persistAndFlush(row);
      return true;
    } catch (error: unknown) {
      // unique constraint violation -> already processed
      const maybeError =
        typeof error === 'object' && error !== null
          ? (error as Record<string, unknown>)
          : undefined;
      const code = String(maybeError?.code ?? '');
      const message = String(maybeError?.message ?? '');
      if (
        code === '23505' ||
        message.toLowerCase().includes('unique') ||
        message.toLowerCase().includes('duplicate')
      ) {
        return false;
      }
      throw error;
    }
  }
}
