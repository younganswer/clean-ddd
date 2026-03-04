import type { Dictionary, IPrimaryKey } from '@mikro-orm/core';

export type RepositoryGetByIdFailHandler = (
	entityName: string,
	/* eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents */
	where: Dictionary | IPrimaryKey | any,
) => Error;

export type RepositoryGetByIdOptions = {
	failHandler?: RepositoryGetByIdFailHandler;
} & Record<string, unknown>;
