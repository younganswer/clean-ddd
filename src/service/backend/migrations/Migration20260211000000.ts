import { Migration } from '@mikro-orm/migrations';

export class Migration20260211000000 extends Migration {
  override async up(): Promise<void> {
    // Needed for `gen_random_uuid()`
    this.addSql('create extension if not exists pgcrypto;');

    // Users are not yet a persisted domain module in this sample, but we seed a
    // lightweight table to satisfy demo data requirements.
    this.addSql(`create table if not exists "users" (
      "subject_id" varchar(64) not null,
      "display_name" varchar(255) not null,
      "email" varchar(255) not null,
      "avatar_url" varchar(1024) null,
      "created_at" timestamptz not null,
      constraint "users_pkey" primary key ("subject_id")
    );`);
    this.addSql(
      `create unique index if not exists "users_email_uq" on "users" ("email");`,
    );

    // Link orders to a user (nullable to avoid breaking existing writes)
    this.addSql(
      `alter table if exists "orders" add column if not exists "user_subject_id" varchar(64) null;`,
    );
    this.addSql(
      `create index if not exists "orders_user_subject_id_created_at_idx" on "orders" ("user_subject_id", "created_at");`,
    );

    // Ensure orders.items exists (older DBs might not have it)
    this.addSql(
      `alter table if exists "orders" add column if not exists "items" jsonb not null default '[{"sku":"SKU-001","quantity":1}]'::jsonb;`,
    );

    // Seed: 100 users
    this
      .addSql(`insert into "users" ("subject_id", "display_name", "email", "avatar_url", "created_at")
      select
        'dummy-' || s.i as subject_id,
        '더미 유저 ' || s.i as display_name,
        'dummy' || s.i || '@example.com' as email,
        'https://example.com/avatar/' || s.i || '.png' as avatar_url,
        now() as created_at
      from generate_series(1, 100) as s(i)
      on conflict ("subject_id") do nothing;`);

    // Seed: 10 inventory SKUs
    this
      .addSql(`insert into "inventory_items" ("sku", "available_quantity", "reserved_quantity", "created_at", "updated_at")
      select
        'SKU-' || lpad(s.i::text, 3, '0') as sku,
        10000 as available_quantity,
        0 as reserved_quantity,
        now() as created_at,
        now() as updated_at
      from generate_series(1, 10) as s(i)
      on conflict ("sku") do nothing;`);

    // Seed: 1000 orders (10 per user)
    this.addSql(`do $$
    declare
      existing_dummy_orders int;
    begin
      select count(*) into existing_dummy_orders
      from "orders"
      where "user_subject_id" like 'dummy-%';

      if existing_dummy_orders < 1000 then
        with users as (
          select 'dummy-' || s.i as subject_id
          from generate_series(1, 100) as s(i)
        ),
        order_rows as (
          select
            u.subject_id as user_subject_id,
            o.n as order_no,
            gen_random_uuid() as order_id,
            ('SKU-' || lpad(((o.n - 1) % 10 + 1)::text, 3, '0')) as sku,
            ((o.n - 1) % 3 + 1) as quantity,
            now() - ((o.n % 30) || ' days')::interval as created_at
          from users u
          cross join generate_series(1, 10) as o(n)
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
          "user_subject_id"
        )
        select
          r.order_id,
          'PAID',
          (r.quantity * 1000),
          'KRW',
          null,
          jsonb_build_array(jsonb_build_object('sku', r.sku, 'quantity', r.quantity)),
          r.created_at,
          r.created_at,
          r.user_subject_id
        from order_rows r;

        -- One shipment per order
        insert into "shipments" ("uuid", "order_id", "status", "created_at", "updated_at")
        select
          gen_random_uuid(),
          o."uuid",
          'PENDING',
          o."created_at",
          o."created_at"
        from "orders" o
        where o."user_subject_id" like 'dummy-%'
          and not exists (select 1 from "shipments" s where s."order_id" = o."uuid");

        -- Reserve inventory for the order items (1 row per (order, sku))
        insert into "inventory_reservations" ("uuid", "order_id", "sku", "quantity", "created_at")
        select
          gen_random_uuid(),
          o."uuid" as order_id,
          (item->>'sku')::varchar(255) as sku,
          (item->>'quantity')::int as quantity,
          o."created_at" as created_at
        from "orders" o
        cross join lateral jsonb_array_elements(o."items") as item
        where o."user_subject_id" like 'dummy-%'
          and not exists (
            select 1
            from "inventory_reservations" r
            where r."order_id" = o."uuid" and r."sku" = (item->>'sku')::varchar(255)
          );
      end if;
    end $$;`);
  }

  override async down(): Promise<void> {
    // Remove shipments + reservations for dummy orders first
    this.addSql(`delete from "inventory_reservations" r
      using "orders" o
      where r."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';`);

    this.addSql(`delete from "shipments" s
      using "orders" o
      where s."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';`);

    this.addSql(`delete from "orders" where "user_subject_id" like 'dummy-%';`);
    this.addSql(`delete from "users" where "subject_id" like 'dummy-%';`);

    this.addSql(
      'drop index if exists "orders_user_subject_id_created_at_idx";',
    );
    this.addSql(
      'alter table if exists "orders" drop column if exists "user_subject_id";',
    );
  }
}
