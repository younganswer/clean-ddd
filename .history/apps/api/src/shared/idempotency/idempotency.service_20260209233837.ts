import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ProcessedEventSchema } from './processed-event.schema';

@Injectable()
export class IdempotencyService {
  constructor(private readonly em: EntityManager) {}

  async claim(consumerName: string, eventId: string): Promise<boolean> {
    try {
      const row = this.em.create(ProcessedEventSchema, {
        consumerName,
        eventId,
      });
      await this.em.persistAndFlush(row);
      return true;
    } catch (error: any) {
      // unique constraint violation -> already processed
      const code = String(error?.code ?? '');
      const message = String(error?.message ?? '');
      if (code === '23505' || message.toLowerCase().includes('unique') || message.toLowerCase().includes('duplicate')) {
        return false;
      }
      throw error;
    }
  }
}
