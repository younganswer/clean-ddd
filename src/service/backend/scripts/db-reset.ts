import 'reflect-metadata';

import { MikroORM } from '@mikro-orm/core';
import process from 'node:process';
import { Client } from 'pg';
import { mikroOrmConfigForRuntime } from '../src/lib/database/mikro-orm.config';
import { checkPostgresSelect1 } from './_checks';
import { withRetries } from './_retry';

const RETRY = { attempts: 30, delayMs: 2_000 };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url || url.trim().length === 0) {
    throw new Error(
      'DATABASE_URL_DIRECT (or DATABASE_URL) is required (e.g. postgresql://...)',
    );
  }
  return url;
}

function qIdent(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function ensureUpdatedAtFunction(client: Client): Promise<void> {
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
}

async function listTablesWithUpdatedAt(
  client: Client,
): Promise<Array<{ schema: string; table: string }>> {
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
}

async function applyUpdatedAtTriggers(client: Client): Promise<number> {
  await ensureUpdatedAtFunction(client);

  const tables = await listTablesWithUpdatedAt(client);
  for (const t of tables) {
    const fullName = `${qIdent(t.schema)}.${qIdent(t.table)}`;

    // Postgres has no CREATE TRIGGER IF NOT EXISTS.
    await client.query(`drop trigger if exists set_updated_at on ${fullName};`);
    await client.query(`
      create trigger set_updated_at
      before update on ${fullName}
      for each row
      execute function public.set_updated_at();
    `);
  }

  return tables.length;
}

async function seed(client: Client): Promise<void> {
  // Reuse the exact seeding approach from db-init.ts.
  // (Kept inline to make db-reset.ts self-contained.)
  await client.query('begin;');

  try {
    await client.query('create extension if not exists pgcrypto;');

    await client.query(`
      truncate table
        "inventory_reservations",
        "shipments",
        "payment_intents",
        "orders",
        "users"
      restart identity;
    `);

    await client.query(`
      insert into "users" ("uuid", "display_name", "email", "avatar_url", "created_at", "updated_at")
      select
        gen_random_uuid() as uuid,
        '더미 유저 ' || s.i as display_name,
        'dummy' || s.i || '@example.com' as email,
        'https://example.com/avatar/' || s.i || '.png' as avatar_url,
        now() as created_at,
        now() as updated_at
      from generate_series(1, 100) as s(i);
    `);

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
			order by random()
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
        r.user_id
      from order_rows r;
    `);

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

    await client.query('commit;');
  } catch (error) {
    try {
      await client.query('rollback;');
    } catch {
      // ignore
    }
    throw error;
  }
}

async function dropAllInPublic(client: Client): Promise<void> {
  // Full reset (data + schema). This is the most reliable way to resolve drift.
  await client.query('begin;');
  try {
    await client.query('drop schema if exists public cascade;');
    await client.query('create schema public;');
    await client.query('grant all on schema public to public;');
    await client.query('commit;');
  } catch (error) {
    try {
      await client.query('rollback;');
    } catch {
      // ignore
    }
    throw error;
  }
}

async function main() {
  const url = databaseUrl();

  await withRetries({ ...RETRY, label: 'Postgres' }, async () => {
    await checkPostgresSelect1(url);
  });

  // Drop schema first (DB 전체 삭제).
  {
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      await dropAllInPublic(client);
      await client.query('create extension if not exists pgcrypto;');
    } finally {
      await client.end();
    }
  }

  // Recreate tables from current MikroORM metadata.
  const orm = await MikroORM.init(mikroOrmConfigForRuntime());
  try {
    const generator = orm.getSchemaGenerator();
    await generator.createSchema();
  } finally {
    await orm.close(true);
  }

  // Apply triggers + seed.
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const triggerTables = await applyUpdatedAtTriggers(client);
    console.log(`updatedAt triggers applied: tables=${triggerTables}`);

    await seed(client);

    console.log('db:reset complete');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`db:reset 실패: ${message}`);
  process.exitCode = 1;
});
