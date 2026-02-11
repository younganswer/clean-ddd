import { INestApplication } from '@nestjs/common';
import { NestApplicationContext } from '@nestjs/core';
import { Type } from '@nestjs/common/interfaces/type.interface';

export class NestApp {
  private static app: INestApplication | NestApplicationContext | null = null;
  private static appName = '';

  static setApp(app: INestApplication | NestApplicationContext): void {
    if (!this.app) this.app = app;
  }

  static getApp(): INestApplication | NestApplicationContext {
    return this.app;
  }

  static setName(name: string): void {
    this.appName = name;
  }

  static getName(): string {
    return this.appName;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  static getDIObject<TInput = any, TResult = TInput>(key: Type<TInput> | Function | string | symbol): TResult | null {
    return this.getApp()?.get(key);
  }
}
