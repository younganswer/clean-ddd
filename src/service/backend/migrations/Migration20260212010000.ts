import { Migration } from '@mikro-orm/migrations';

/**
 * Align DB schema with BaseSchema/BaseEntity conventions.
 * - add `id` (bigserial) for stable ordering
 * - ensure `updated_at` exists where BaseSchema enforces it
 * - reshape `users` to have `id/uuid/created_at/updated_at`
 * - reshape `inventory_items` to use uuid PK + sku unique
 * - update processed_events to use created_at/updated_at instead of processed_at
 */
export class Migration20260212010000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('create extension if not exists pgcrypto;');

    // ===== users =====
    this.addSql(`create table if not exists "users" (
      "uuid" uuid not null default gen_random_uuid(),
      "id" bigserial,
      "subject_id" varchar(64) not null,
      "display_name" varchar(255) not null,
      "email" varchar(255) not null,
      "avatar_url" varchar(1024) null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      constraint "users_pkey" primary key ("uuid")
    );`);

    // If an older users table exists (subject_id PK), convert it in-place.
    this.addSql(
      `alter table if exists "users" add column if not exists "uuid" uuid not null default gen_random_uuid();`,
    );
    this.addSql(
      `alter table if exists "users" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `alter table if exists "users" add column if not exists "updated_at" timestamptz not null default now();`,
    );
    this.addSql(
      `alter table if exists "users" drop constraint if exists "users_pkey";`,
    );
    this.addSql(
      `alter table if exists "users" add constraint "users_pkey" primary key ("uuid");`,
    );

    // Indexes (after columns exist)
    this.addSql(
      `create unique index if not exists "users_id_uq" on "users" ("id");`,
    );
    this.addSql(
      `create unique index if not exists "users_subject_id_uq" on "users" ("subject_id");`,
    );
    this.addSql(
      `create unique index if not exists "users_email_uq" on "users" ("email");`,
    );

    // ===== orders =====
    this.addSql(
      `alter table if exists "orders" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "orders_id_uq" on "orders" ("id");`,
    );

    // ===== shipments =====
    this.addSql(
      `alter table if exists "shipments" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "shipments_id_uq" on "shipments" ("id");`,
    );

    // ===== payment_intents =====
    this.addSql(
      `alter table if exists "payment_intents" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "payment_intents_id_uq" on "payment_intents" ("id");`,
    );

    // ===== inventory_items =====
    // Old schema used sku PK; current schema uses uuid PK + sku unique.
    this.addSql(
      `alter table if exists "inventory_items" add column if not exists "uuid" uuid not null default gen_random_uuid();`,
    );
    this.addSql(
      `alter table if exists "inventory_items" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "inventory_items_id_uq" on "inventory_items" ("id");`,
    );
    this.addSql(
      `create unique index if not exists "inventory_items_sku_uq" on "inventory_items" ("sku");`,
    );
    this.addSql(
      `alter table if exists "inventory_items" drop constraint if exists "inventory_items_pkey";`,
    );
    this.addSql(
      `alter table if exists "inventory_items" add constraint "inventory_items_pkey" primary key ("uuid");`,
    );

    // ===== inventory_reservations =====
    this.addSql(
      `alter table if exists "inventory_reservations" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "inventory_reservations_id_uq" on "inventory_reservations" ("id");`,
    );
    this.addSql(
      `alter table if exists "inventory_reservations" add column if not exists "updated_at" timestamptz not null default now();`,
    );

    // ===== outbox_events =====
    this.addSql(
      `alter table if exists "outbox_events" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "outbox_events_id_uq" on "outbox_events" ("id");`,
    );
    this.addSql(
      `alter table if exists "outbox_events" add column if not exists "updated_at" timestamptz not null default now();`,
    );

    // ===== processed_events =====
    this.addSql(
      `alter table if exists "processed_events" add column if not exists "id" bigserial;`,
    );
    this.addSql(
      `create unique index if not exists "processed_events_id_uq" on "processed_events" ("id");`,
    );
    this.addSql(
      `alter table if exists "processed_events" add column if not exists "created_at" timestamptz not null default now();`,
    );
    this.addSql(
      `alter table if exists "processed_events" add column if not exists "updated_at" timestamptz not null default now();`,
    );
    this.addSql(
      `update "processed_events" set "created_at" = coalesce("created_at", "processed_at", now());`,
    );
    this.addSql(
      `alter table if exists "processed_events" drop column if exists "processed_at";`,
    );
    this.addSql(`drop index if exists "processed_events_processed_at_idx";`);
    this.addSql(
      `create index if not exists "processed_events_created_at_idx" on "processed_events" ("created_at");`,
    );
  }

  override async down(): Promise<void> {
    // Down migrations are intentionally conservative in this sample.
    // (Reverting PK changes safely would require data migration.)
  }
}
