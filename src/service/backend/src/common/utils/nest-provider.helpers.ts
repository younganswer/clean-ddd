import { type InjectionToken, type Provider, type Type } from '@nestjs/common';

export function useClassProvider(
	provide: InjectionToken,
	useClass: Type<unknown>,
): Provider {
	return { provide, useClass };
}

export function useClassProviders<TClass>(
	provide: InjectionToken,
	useClass: Type<TClass>,
): [Type<TClass>, Provider] {
	return [useClass, useClassProvider(provide, useClass)];
}

export function useFactoryProvider<TArgs extends unknown[], TResult>(
	provide: InjectionToken,
	useFactory: (...args: TArgs) => TResult | Promise<TResult>,
	inject?: readonly InjectionToken[],
): Provider {
	return inject && inject.length > 0
		? { provide, useFactory, inject: [...inject] }
		: { provide, useFactory };
}

export function useFactoryProviders<
	TInject extends readonly Type<unknown>[],
	TArgs extends unknown[],
	TResult,
>(
	provide: InjectionToken,
	useFactory: (...args: TArgs) => TResult | Promise<TResult>,
	inject: TInject,
): [...TInject, Provider] {
	return [...inject, useFactoryProvider(provide, useFactory, inject)] as [
		...TInject,
		Provider,
	];
}
