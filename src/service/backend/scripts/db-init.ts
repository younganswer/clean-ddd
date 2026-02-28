import 'reflect-metadata';

import { MikroORM } from '@mikro-orm/core';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { Client } from 'pg';
import { mikroOrmConfigForRuntime } from '@/lib/database/mikro-orm.config';
import { checkPostgresSelect1 } from '@/scripts/_checks';
import { withRetries } from '@/scripts/_retry';

const RETRY = { attempts: 30, delayMs: 2_000 };

const databaseUrl = (): string => {
	const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
	if (!url || url.trim().length === 0) {
		throw new Error(
			'DATABASE_URL_DIRECT (or DATABASE_URL) is required (e.g. postgresql://...)',
		);
	}
	return url;
};

const qIdent = (identifier: string): string => {
	return `"${identifier.replaceAll('"', '""')}"`;
};

const ensureUpdatedAtFunction = async (client: Client): Promise<void> => {
	await client.query(`
    create or replace function public.set_updated_at()
    returns trigger
    language plpgsql
    as $$
    begin
      new.updated_at = now();
      return new;
    end
    $$;
  `);
};

const listTablesWithUpdatedAt = async (
	client: Client,
): Promise<Array<{ schema: string; table: string }>> => {
	const res = await client.query<{
		schema: string;
		table: string;
	}>(`
    select
      c.table_schema as schema,
      c.table_name as table
    from information_schema.columns c
    where c.column_name = 'updated_at'
      and c.table_schema not in ('pg_catalog', 'information_schema')
    group by c.table_schema, c.table_name
    order by c.table_schema, c.table_name;
  `);

	return res.rows;
};

const applyUpdatedAtTriggers = async (client: Client): Promise<number> => {
	await ensureUpdatedAtFunction(client);

	const tables = await listTablesWithUpdatedAt(client);
	for (const t of tables) {
		const fullName = `${qIdent(t.schema)}.${qIdent(t.table)}`;

		// Postgres has no CREATE TRIGGER IF NOT EXISTS.
		await client.query(
			`drop trigger if exists set_updated_at on ${fullName};`,
		);
		await client.query(`
      create trigger set_updated_at
      before update on ${fullName}
      for each row
      execute function public.set_updated_at();
    `);
	}

	return tables.length;
};

const seed = async (client: Client): Promise<void> => {
	await client.query('begin;');

	try {
		await client.query('create extension if not exists pgcrypto;');

		// Replace (not append) the demo dataset so counts are deterministic.
		await client.query(`
      truncate table
        "inventory_reservations",
        "shipments",
        "payment_intents",
        "orders",
        "users"
      restart identity;
    `);

		// Users: exactly 100
		await client.query(`
      insert into "users" ("uuid", "display_name", "email", "avatar_id", "created_at", "updated_at")
      select
        gen_random_uuid() as uuid,
        '더미 유저 ' || s.i as display_name,
        'dummy' || s.i || '@example.com' as email,
        null as avatar_id,
        now() as created_at,
        now() as updated_at
      from generate_series(1, 100) as s(i);
    `);

		// Inventory: 10 SKUs, 1,000 each (reserved will be recomputed below)
		await client.query(`
      delete from "inventory_items" where "sku" like 'SKU-%';
    `);

		await client.query(`
      insert into "inventory_items" (
        "uuid",
        "sku",
        "price_currency",
        "price_amount_minor",
        "available_quantity",
        "reserved_quantity",
        "created_at",
        "updated_at"
      )
      select
        gen_random_uuid() as uuid,
        'SKU-' || lpad(s.i::text, 3, '0') as sku,
        (case when random() < 0.5 then 'KRW' else 'USD' end)::varchar(3) as price_currency,
        (100 + floor(random() * 9900))::int as price_amount_minor,
        1000 as available_quantity,
        0 as reserved_quantity,
        now() as created_at,
        now() as updated_at
      from generate_series(1, 10) as s(i)
    `);

		// Orders: exactly 200 (2 per user), each order picks a random SKU.
		await client.query(`
      with user_rows as (
        select u."uuid" as user_id
        from "users" u
        where u."email" like 'dummy%@example.com'
        order by u."email" asc
      ),
      order_rows as (
        select
          u.user_id as user_id,
          o.n as order_no,
          gen_random_uuid() as order_id,
          gen_random_uuid() as payment_id,
          inv.sku as sku,
          1 as quantity,
          inv.price_amount_minor as amount,
          inv.price_currency::varchar(16) as currency,
          (now() - ((o.n % 30) || ' days')::interval) as created_at
        from user_rows u
        cross join generate_series(1, 2) as o(n)
		cross join lateral (
			select i."sku", i."price_currency", i."price_amount_minor"
			from "inventory_items" i
			where i."sku" like 'SKU-%'
			order by md5(u.user_id::text || ':' || o.n::text || ':' || i."sku")
			limit 1
		) inv
      )
      insert into "orders" (
        "uuid",
        "status",
        "amount",
        "currency",
        "payment_id",
        "items",
        "ordered_at",
        "paid_at",
        "created_at",
        "updated_at",
        "user_id"
      )
      select
        r.order_id,
        'PAID',
        r.amount,
        r.currency,
        r.payment_id,
        jsonb_build_array(jsonb_build_object('sku', r.sku, 'quantity', r.quantity)),
        r.created_at,
        r.created_at,
        r.created_at,
        r.created_at,
        r.user_id
      from order_rows r;
    `);

		// Payment intents: SUCCEEDED for all orders
		await client.query(`
      insert into "payment_intents" (
        "uuid",
        "order_id",
        "amount",
        "currency",
        "status",
        "created_at",
        "updated_at"
      )
      select
        o."payment_id",
        o."uuid",
        o."amount",
        o."currency",
        'SUCCEEDED',
        o."created_at",
        o."created_at"
      from "orders" o;
    `);

		// Shipments: exactly 1 per order
		await client.query(`
      insert into "shipments" ("uuid", "order_id", "status", "created_at", "updated_at")
      select
        gen_random_uuid(),
        o."uuid",
        'DELIVERED',
        o."created_at",
        o."created_at"
      from "orders" o;
    `);

		// Inventory reservations: one per order, based on items
		await client.query(`
      insert into "inventory_reservations" (
        "uuid",
        "order_id",
        "sku",
        "quantity",
        "created_at",
        "updated_at"
      )
      select
        gen_random_uuid(),
        o."uuid" as order_id,
        (item->>'sku')::varchar(255) as sku,
        (item->>'quantity')::int as quantity,
        o."created_at" as created_at,
        o."created_at" as updated_at
      from "orders" o
      cross join lateral jsonb_array_elements(o."items") as item;
    `);

		// Reflect reservations into inventory stock (available/reserved)
		await client.query(`
      with agg as (
        select r."sku", sum(r."quantity")::int as qty
        from "inventory_reservations" r
        group by r."sku"
      )
      update "inventory_items" i
      set
        "reserved_quantity" = a.qty,
        "available_quantity" = 1000 - a.qty,
        "updated_at" = now()
      from agg a
      where i."sku" = a."sku";
    `);

		await client.query(`
      update "inventory_items" i
      set
        "reserved_quantity" = 0,
        "available_quantity" = 1000,
        "updated_at" = now()
      where i."sku" like 'SKU-%'
        and not exists (select 1 from "inventory_reservations" r where r."sku" = i."sku");
    `);

		const dist = await client.query<{
			orders: number;
			reservations: number;
			distinct_skus: number;
			max_sku_orders: number;
		}>(`
      with sku_dist as (
        select r."sku", count(*)::int as cnt
        from "inventory_reservations" r
        group by r."sku"
      )
      select
        (select count(*) from "orders")::int as orders,
        (select count(*) from "inventory_reservations")::int as reservations,
        coalesce((select count(*) from sku_dist), 0)::int as distinct_skus,
        coalesce((select max(cnt) from sku_dist), 0)::int as max_sku_orders;
    `);

		const row = dist.rows[0];
		if (row.orders !== 200 || row.reservations !== 200) {
			throw new Error(
				`seed invariant failed: orders=${row.orders}, reservations=${row.reservations}`,
			);
		}
		if (row.distinct_skus <= 1) {
			throw new Error(
				`seed randomness failed: distinct_skus=${row.distinct_skus}, max_sku_orders=${row.max_sku_orders}`,
			);
		}

		await client.query('commit;');
	} catch (error) {
		try {
			await client.query('rollback;');
		} catch {
			// ignore
		}
		throw error;
	}
};

const seedMongoAvatars = async (client: Client): Promise<number> => {
	const mongoUrl = process.env.MONGODB_URL?.trim();
	if (!mongoUrl) {
		console.log('mongo avatar seed skipped: MONGODB_URL is not set');
		return 0;
	}

	const dbName = process.env.MONGODB_DB_NAME?.trim() || 'clean_ddd';
	const collectionName =
		process.env.MONGODB_AVATAR_COLLECTION?.trim() || 'avatars';

	const users = await client.query<{ userId: string }>(`
    select u."uuid" as "userId"
    from "users" u
    order by u."id" asc;
  `);

	if (users.rows.length === 0) return 0;

	const now = new Date();
	const docs = users.rows.map((user, index) => ({
		_id: randomUUID(),
		userId: user.userId,
		imageUrl: `https://example.com/avatar/${index + 1}.png`,
		createdAt: now,
		updatedAt: now,
	}));

	const mongoClient = new MongoClient(mongoUrl);
	await mongoClient.connect();

	try {
		const avatars = mongoClient.db(dbName).collection<{
			_id: string;
			userId: string;
			imageUrl: string;
			createdAt: Date;
			updatedAt: Date;
		}>(collectionName);

		await avatars.deleteMany({});
		await avatars.insertMany(docs);

		await client.query('begin;');
		try {
			for (const doc of docs) {
				await client.query(
					`update "users" set "avatar_id" = $1, "updated_at" = now() where "uuid" = $2`,
					[doc._id, doc.userId],
				);
			}
			await client.query('commit;');
		} catch (error) {
			try {
				await client.query('rollback;');
			} catch {
				// ignore
			}
			throw error;
		}

		return docs.length;
	} finally {
		await mongoClient.close();
	}
};

export const runDbInit = async () => {
	const url = databaseUrl();

	await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
		await checkPostgresSelect1(url);
	});

	{
		const client = new Client({ connectionString: url });
		await client.connect();
		try {
			await client.query('create extension if not exists pgcrypto;');
		} finally {
			await client.end();
		}
	}

	const orm = await MikroORM.init(mikroOrmConfigForRuntime());
	try {
		const generator = orm.getSchemaGenerator();
		await generator.createSchema();
	} finally {
		await orm.close(true);
	}

	const client = new Client({ connectionString: url });
	await client.connect();

	try {
		const connInfo = await client.query<{
			db: string;
			usr: string;
			server_addr: string | null;
			server_port: number | null;
		}>(
			'select current_database() as db, current_user as usr, inet_server_addr()::text as server_addr, inet_server_port() as server_port;',
		);

		const info = connInfo.rows[0];
		console.log(
			`init database: db=${info.db}, user=${info.usr}, server=${info.server_addr ?? ''}:${info.server_port ?? ''}`,
		);

		const triggerTables = await applyUpdatedAtTriggers(client);
		console.log(`updatedAt triggers applied: tables=${triggerTables}`);

		await seed(client);
		const avatarSeeded = await seedMongoAvatars(client);

		const summary = await client.query(`
      select
        (select count(*) from "users")::int as users,
        (select count(*) from "users" where "avatar_id" is not null)::int as users_with_avatar_id,
        (select count(*) from "orders")::int as orders,
        (select count(*) from "payment_intents")::int as payments,
        (select count(*) from "shipments")::int as shipments,
        (select sum("available_quantity") from "inventory_items" where "sku" like 'SKU-%')::int as inventory_available_total,
        (select sum("reserved_quantity") from "inventory_items" where "sku" like 'SKU-%')::int as inventory_reserved_total;
    `);

		const row = summary.rows[0] as {
			users: number;
			users_with_avatar_id: number;
			orders: number;
			payments: number;
			shipments: number;
			inventory_available_total: number;
			inventory_reserved_total: number;
		};

		console.log(
			`init complete: users=${row.users}, users_with_avatar_id=${row.users_with_avatar_id}, avatar_seeded=${avatarSeeded}, ` +
				`orders=${row.orders}, payments=${row.payments}, shipments=${row.shipments}, ` +
				`inventory_available_total=${row.inventory_available_total}, inventory_reserved_total=${row.inventory_reserved_total}`,
		);
	} finally {
		await client.end();
	}
};

if (require.main === module) {
	runDbInit().catch((error) => {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`db:init 실패: ${message}`);
		process.exitCode = 1;
	});
}
