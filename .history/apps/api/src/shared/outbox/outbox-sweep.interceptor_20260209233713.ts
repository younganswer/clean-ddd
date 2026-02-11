import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { OutboxSweeper } from './outbox.sweeper';

@Injectable()
export class OutboxSweepInterceptor implements NestInterceptor {
  constructor(private readonly sweeper: OutboxSweeper) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap({
        finalize: async () => {
          try {
            await this.sweeper.sweepAndEnqueue(10);
          } catch {
            // best-effort
          }
        },
      }),
    );
  }
}
