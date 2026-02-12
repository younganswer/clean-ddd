import { Migration } from '@mikro-orm/migrations';

export class Migration20260212000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('create extension if not exists pgcrypto;');

    // Ensure required columns exist (safe for re-run / existing DBs)
    this.addSql(
      `alter table if exists "orders" add column if not exists "user_subject_id" varchar(64) null;`,
    );
    this.addSql(
      `alter table if exists "orders" add column if not exists "items" jsonb not null default '[{"sku":"SKU-001","quantity":1}]'::jsonb;`,
    );

    // Re-seed dummy dataset to match the current spec:
    // - users: 100
    // - inventory: 10 SKUs, 10,000 each
    // - orders: 100 per user (10,000 total)
    // - each order links to random SKU
    // - payment + shipment completed
    this.addSql(`do $$
    begin
      -- cleanup previous dummy data (best-effort)
      delete from "inventory_reservations" r
        using "orders" o
        where r."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "shipments" s
        using "orders" o
        where s."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "payment_intents" p
        using "orders" o
        where p."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "orders" where "user_subject_id" like 'dummy-%';
      delete from "users" where "subject_id" like 'dummy-%';

      -- users
      insert into "users" ("subject_id", "display_name", "email", "avatar_url", "created_at")
      select
        'dummy-' || s.i as subject_id,
        '더미 유저 ' || s.i as display_name,
        'dummy' || s.i || '@example.com' as email,
        'https://example.com/avatar/' || s.i || '.png' as avatar_url,
        now() as created_at
      from generate_series(1, 100) as s(i)
      on conflict ("subject_id") do nothing;

      -- inventory (10 kinds x 10,000)
      insert into "inventory_items" (
        "sku",
        "available_quantity",
        "reserved_quantity",
        "created_at",
        "updated_at"
      )
      select
        'SKU-' || lpad(s.i::text, 3, '0') as sku,
        10000 as available_quantity,
        0 as reserved_quantity,
        now() as created_at,
        now() as updated_at
      from generate_series(1, 10) as s(i)
      on conflict ("sku") do update set
        "available_quantity" = excluded."available_quantity",
        "reserved_quantity" = 0,
        "updated_at" = excluded."updated_at";

      -- orders + payments (100 per user)
      with user_rows as (
        select 'dummy-' || s.i as subject_id
        from generate_series(1, 100) as s(i)
      ),
      order_rows as (
        select
          u.subject_id as user_subject_id,
          o.n as order_no,
          gen_random_uuid() as order_id,
          gen_random_uuid() as payment_id,
          (
            'SKU-' ||
            lpad(((floor(random() * 10) + 1)::int)::text, 3, '0')
          ) as sku,
          1 as quantity,
          (1000)::int as amount,
          'KRW'::varchar(16) as currency,
          (
            now()
            - (floor(random() * 30)::int || ' days')::interval
            - (floor(random() * 86400)::int || ' seconds')::interval
          ) as created_at
        from user_rows u
        cross join generate_series(1, 100) as o(n)
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
        r.amount,
        r.currency,
        r.payment_id,
        jsonb_build_array(
          jsonb_build_object('sku', r.sku, 'quantity', r.quantity)
        ),
        r.created_at,
        r.created_at,
        r.user_subject_id
      from order_rows r;

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
      from "orders" o
      where o."user_subject_id" like 'dummy-%';

      -- shipments: completed
      insert into "shipments" ("uuid", "order_id", "status", "created_at", "updated_at")
      select
        gen_random_uuid(),
        o."uuid",
        'DELIVERED',
        o."created_at",
        o."created_at"
      from "orders" o
      where o."user_subject_id" like 'dummy-%'
        and not exists (select 1 from "shipments" s where s."order_id" = o."uuid");

      -- inventory reservations (one per order, based on items)
      insert into "inventory_reservations" (
        "uuid",
        "order_id",
        "sku",
        "quantity",
        "created_at"
      )
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

      -- reflect reservations into inventory stock (available/reserved)
      with agg as (
        select r."sku", sum(r."quantity")::int as qty
        from "inventory_reservations" r
        join "orders" o on o."uuid" = r."order_id"
        where o."user_subject_id" like 'dummy-%'
        group by r."sku"
      )
      update "inventory_items" i
      set
        "reserved_quantity" = a.qty,
        "available_quantity" = 10000 - a.qty,
        "updated_at" = now()
      from agg a
      where i."sku" = a."sku";

      update "inventory_items" i
      set
        "reserved_quantity" = 0,
        "available_quantity" = 10000,
        "updated_at" = now()
      where i."sku" like 'SKU-%'
        and not exists (select 1 from "inventory_reservations" r where r."sku" = i."sku");
    end $$;`);
  }

  override async down(): Promise<void> {
    this.addSql(`do $$
    begin
      delete from "inventory_reservations" r
        using "orders" o
        where r."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "shipments" s
        using "orders" o
        where s."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "payment_intents" p
        using "orders" o
        where p."order_id" = o."uuid" and o."user_subject_id" like 'dummy-%';

      delete from "orders" where "user_subject_id" like 'dummy-%';
      delete from "users" where "subject_id" like 'dummy-%';
    end $$;`);
  }
}
