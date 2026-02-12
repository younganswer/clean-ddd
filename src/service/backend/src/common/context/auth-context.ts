import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

export type AuthActorType = 'user' | 'anonymous' | 'system';

export interface AuthActor {
  subjectId: string;
  type: AuthActorType;
}

export interface AuthContext {
  actor: AuthActor;
}

const DEFAULT_ANONYMOUS_ACTOR: AuthActor = {
  subjectId: 'anonymous',
  type: 'anonymous',
};

@Injectable()
export class AuthContextAccessor {
  private readonly storage = new AsyncLocalStorage<AuthContext>();

  runWithNewContext(callback: () => void): void {
    this.storage.run({ actor: { ...DEFAULT_ANONYMOUS_ACTOR } }, callback);
  }

  get(): AuthContext | undefined {
    return this.storage.getStore();
  }

  getOrAnonymous(): AuthContext {
    return this.get() ?? { actor: { ...DEFAULT_ANONYMOUS_ACTOR } };
  }

  setActor(actor: AuthActor): void {
    const current = this.storage.getStore();
    if (current) {
      current.actor = actor;
      return;
    }

    // Fallback for non-HTTP execution or misconfigured middleware.
    this.storage.enterWith({ actor });
  }
}
