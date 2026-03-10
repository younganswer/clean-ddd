import type { Dictionary, FindOptions, IPrimaryKey } from '@mikro-orm/core';

export type FindPageOptions<Entity extends object = object> = Pick<
	FindOptions<Entity>,
	'limit' | 'offset'
>;

export type PageOptions<Entity extends object = object> =
	FindPageOptions<Entity> & {
		limit: NonNullable<FindOptions<Entity>['limit']>;
	};

export type RepositoryFindOptions<Entity extends object = object> =
	FindPageOptions<Entity>;

export type RepositoryPageOptions<Entity extends object = object> =
	PageOptions<Entity>;

export type RepositoryGetByIdFailHandler = (
	entityName: string,
	/* eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents */
	where: Dictionary | IPrimaryKey | any,
) => Error;

export type RepositoryGetByIdOptions = {
	failHandler?: RepositoryGetByIdFailHandler;
} & Record<string, unknown>;
