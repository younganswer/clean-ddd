import { Migration } from '@mikro-orm/migrations';

export class Migration20260209000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "orders" (
      "uuid" uuid not null,
      "status" varchar(64) not null,
      "amount" int not null,
      "currency" varchar(16) not null,
      "payment_id" uuid null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "orders_pkey" primary key ("uuid")
    );`);
    this.addSql(`create index if not exists "orders_status_created_at_idx" on "orders" ("status", "created_at");`);

    this.addSql(`create table if not exists "payment_intents" (
      "uuid" uuid not null,
      "order_id" uuid not null,
      "amount" int not null,
      "currency" varchar(16) not null,
      "status" varchar(64) not null,
      "created_at" timestamptz not null,
      "updated_at" timestamptz not null,
      constraint "payment_intents_pkey" primary key ("uuid")
    );`);
    this.addSql(`create index if not exists "payment_intents_order_id_created_at_idx" on "payment_intents" ("order_id", "created_at");`);

    this.addSql(`create table if not exists "outbox_events" (
      "uuid" uuid not null,
      "event_type" varchar(255) not null,
      "payload" jsonb not null,
      "status" varchar(32) not null,
      "attempt" int not null,
      "next_attempt_at" timestamptz not null,
      "locked_until" timestamptz null,
      "created_at" timestamptz not null,
      "published_at" timestamptz null,
      "last_error" text null,
      constraint "outbox_events_pkey" primary key ("uuid")
    );`);
    this.addSql(`create index if not exists "outbox_events_status_next_attempt_at_idx" on "outbox_events" ("status", "next_attempt_at");`);

    this.addSql(`create table if not exists "processed_events" (
      "uuid" uuid not null,
      "consumer_name" varchar(255) not null,
      "event_id" uuid not null,
      "processed_at" timestamptz not null,
      constraint "processed_events_pkey" primary key ("uuid"),
      constraint "uq_processed_consumer_event" unique ("consumer_name", "event_id")
    );`);
    this.addSql(`create index if not exists "processed_events_processed_at_idx" on "processed_events" ("processed_at");`);
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "processed_events" cascade;');
    this.addSql('drop table if exists "outbox_events" cascade;');
    this.addSql('drop table if exists "payment_intents" cascade;');
    this.addSql('drop table if exists "orders" cascade;');
  }
}
