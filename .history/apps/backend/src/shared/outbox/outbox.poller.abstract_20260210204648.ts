import { sleep } from '../../common/utils/sleep';

export abstract class OutboxPollerAbstract {
  private stopped = false;

  protected stop(): void {
    this.stopped = true;
  }

  protected abstract pollOnce(): Promise<void>;

  protected async loop(options?: { onErrorSleepMs?: number }): Promise<void> {
    const onErrorSleepMs = options?.onErrorSleepMs ?? 1_000;

    while (!this.stopped) {
      try {
        await this.pollOnce();
      } catch {
        await sleep(onErrorSleepMs);
      }
    }
  }
}
