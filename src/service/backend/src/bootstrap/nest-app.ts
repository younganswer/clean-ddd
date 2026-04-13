import { INestApplication } from '@nestjs/common';
import { NestApplicationContext } from '@nestjs/core';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { SystemNestAppNotInitializedException } from '@/shared/exceptions';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';

export class NestApp {
	private static app: INestApplication | NestApplicationContext | null = null;
	private static appName = '';

	static setApp(app: INestApplication | NestApplicationContext): void {
		if (!this.app) this.app = app;
	}

	static getApp(): INestApplication | NestApplicationContext {
		if (!this.app) {
			throw InfrastructureExceptionFactory.create(
				SystemNestAppNotInitializedException,
			);
		}
		return this.app;
	}

	static setName(name: string): void {
		this.appName = name;
	}

	static getName(): string {
		return this.appName;
	}

	static getDIObject<TInput = any, TResult = TInput>(
		key: Type<TInput> | string | symbol,
	): TResult | null {
		return this.getApp().get(key);
	}
}
