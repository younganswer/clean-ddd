import { Migration } from '@mikro-orm/migrations';

export class Migration20260210000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "orders" add column if not exists "items" jsonb not null default '[{"sku":"SKU-001","quantity":1}]'::jsonb;`,
    );

    this.addSql(`create table if not exists "shipments" (
      "uuid" uuid not null,
      "order_id" uuid not null,
      "status" varchar(64) not null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "shipments_pkey" primary key ("uuid"),
      constraint "uq_shipments_order" unique ("order_id")
    );`);
    this.addSql(
      `create index if not exists "shipments_created_at_idx" on "shipments" ("created_at");`,
    );

    this.addSql(`create table if not exists "inventory_items" (
      "sku" varchar(255) not null,
      "available_quantity" int not null,
      "reserved_quantity" int not null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "inventory_items_pkey" primary key ("sku")
    );`);
    this.addSql(
      `create index if not exists "inventory_items_updated_at_idx" on "inventory_items" ("updated_at");`,
    );

    this.addSql(`create table if not exists "inventory_reservations" (
      "uuid" uuid not null,
      "order_id" uuid not null,
      "sku" varchar(255) not null,
      "quantity" int not null,
      "created_at" timestamptz not null,
      constraint "inventory_reservations_pkey" primary key ("uuid"),
      constraint "uq_inventory_reservations_order_sku" unique ("order_id", "sku")
    );`);
    this.addSql(
      `create index if not exists "inventory_reservations_created_at_idx" on "inventory_reservations" ("created_at");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "inventory_reservations" cascade;');
    this.addSql('drop table if exists "inventory_items" cascade;');
    this.addSql('drop table if exists "shipments" cascade;');
    this.addSql(
      'alter table if exists "orders" drop column if exists "items";',
    );
  }
}
