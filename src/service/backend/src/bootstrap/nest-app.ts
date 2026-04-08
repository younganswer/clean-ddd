import { INestApplication } from '@nestjs/common';
import { NestApplicationContext } from '@nestjs/core';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { SYSTEM_INFRA_ERRORS } from '@/shared/errors';
import { InfrastructureErrorFactory } from '@/common/errors/base.error-factory';

export class NestApp {
	private static app: INestApplication | NestApplicationContext | null = null;
	private static appName = '';

	static setApp(app: INestApplication | NestApplicationContext): void {
		if (!this.app) this.app = app;
	}

	static getApp(): INestApplication | NestApplicationContext {
		if (!this.app) {
			throw InfrastructureErrorFactory.create(
				SYSTEM_INFRA_ERRORS.NEST_APP_NOT_INITIALIZED,
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
