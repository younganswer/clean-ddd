import process from 'node:process';
import { Client } from 'pg';

const databaseUrl = (): string => {
	const url = process.env.DATABASE_URL_PRIMARY ?? process.env.DATABASE_URL;
	if (!url || url.trim().length === 0) {
		throw new Error(
			'DATABASE_URL_PRIMARY (or DATABASE_URL) is required (e.g. postgresql://...)',
		);
	}
	return url;
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

const qIdent = (identifier: string): string => {
	return `"${identifier.replaceAll('"', '""')}"`;
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

const main = async () => {
	const url = databaseUrl();
	const client = new Client({ connectionString: url });
	await client.connect();

	try {
		const res = await client.query<{
			db: string;
			usr: string;
		}>('select current_database() as db, current_user as usr;');
		const info = res.rows[0];

		const count = await applyUpdatedAtTriggers(client);
		console.log(
			`updatedAt triggers applied: tables=${count}, db=${info.db}, user=${info.usr}`,
		);
	} finally {
		await client.end();
	}
};

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`db:triggers 실패: ${message}`);
	process.exitCode = 1;
});
