import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contractsDir = resolve(__dirname, "..");

const targets = {
	api: {
		specFile: resolve(contractsDir, "specs/openapi.yaml"),
		entryFile: resolve(contractsDir, "generated/api/types.generated.ts"),
		sectionsDir: resolve(contractsDir, "generated/api/sections"),
		entryName: "types.generated.ts",
		sourceLabel: "specs/openapi.yaml",
		prefix: "Api",
	},
	bff: {
		specFile: resolve(contractsDir, "specs/openapi.bff.yaml"),
		entryFile: resolve(
			contractsDir,
			"generated/bff/types.bff.generated.ts",
		),
		sectionsDir: resolve(contractsDir, "generated/bff/sections"),
		entryName: "types.bff.generated.ts",
		sourceLabel: "specs/openapi.bff.yaml",
		prefix: "Bff",
	},
};

const markers = [
	"export interface paths {",
	"export type webhooks =",
	"export interface components {",
	"export type $defs =",
	"export type operations =",
];

function extractSection(source, marker, nextMarker) {
	const start = source.indexOf(marker);
	if (start < 0) {
		throw new Error(`Could not find marker: ${marker}`);
	}

	const end = nextMarker ? source.indexOf(nextMarker, start) : source.length;
	if (nextMarker && end < 0) {
		throw new Error(`Could not find next marker: ${nextMarker}`);
	}

	return source.slice(start, end).trimEnd() + "\n";
}

function writeFile(targetPath, content) {
	mkdirSync(dirname(targetPath), { recursive: true });
	writeFileSync(targetPath, content, "utf8");
}

function countChar(text, char) {
	let count = 0;
	for (const ch of text) {
		if (ch === char) {
			count += 1;
		}
	}
	return count;
}

function dedentLines(lines) {
	const nonEmpty = lines.filter((line) => line.trim().length > 0);
	if (nonEmpty.length === 0) {
		return lines;
	}

	const minIndent = Math.min(
		...nonEmpty.map((line) => {
			const match = line.match(/^(\s*)/);
			return match ? match[1].length : 0;
		}),
	);

	return lines.map((line) => line.slice(Math.min(minIndent, line.length)));
}

function findMatchingBrace(text, openBraceIndex) {
	let depth = 0;
	for (let i = openBraceIndex; i < text.length; i += 1) {
		const ch = text[i];
		if (ch === "{") {
			depth += 1;
			continue;
		}
		if (ch === "}") {
			depth -= 1;
			if (depth === 0) {
				return i;
			}
		}
	}

	throw new Error("Could not find matching brace");
}

function generateRawFromSpec(specFile) {
	const result = spawnSync("pnpm", ["exec", "openapi-typescript", specFile], {
		cwd: contractsDir,
		encoding: "utf8",
	});

	if (result.status !== 0) {
		throw new Error(
			[
				`openapi-typescript failed for ${specFile}`,
				result.stderr?.trim() ?? "",
			]
				.filter(Boolean)
				.join("\n"),
		);
	}

	return result.stdout;
}

function splitSchemaEntries(schemaBlock) {
	const lines = schemaBlock.split("\n");
	const entries = [];
	let current = null;
	let depth = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			if (current) {
				current.lines.push(line);
			}
			continue;
		}

		const entryMatch = line.match(/^\s*([A-Za-z0-9_]+):\s*(.*)$/);
		if (depth === 0 && entryMatch) {
			if (current) {
				entries.push(current);
			}
			current = {
				name: entryMatch[1],
				lines: [entryMatch[2]],
			};
			depth += countChar(line, "{") - countChar(line, "}");
			continue;
		}

		if (current) {
			current.lines.push(line);
			depth += countChar(line, "{") - countChar(line, "}");
		}
	}

	if (current) {
		entries.push(current);
	}

	return entries;
}

function slugifyRoutePath(routePath) {
	if (routePath === "/") {
		return "root";
	}

	return routePath
		.replace(/^\//, "")
		.split("/")
		.map((segment) =>
			segment
				.replace(/[{}]/g, "")
				.replace(/[^A-Za-z0-9_-]+/g, "-")
				.replace(/^-+|-+$/g, ""),
		)
		.filter(Boolean)
		.join("__");
}

function toPascalCase(value) {
	return value
		.split(/[^A-Za-z0-9]+/)
		.filter(Boolean)
		.map((part) => part[0].toUpperCase() + part.slice(1))
		.join("");
}

function splitPathEntries(pathsBlock) {
	const openBraceIndex = pathsBlock.indexOf("{");
	const closeBraceIndex = pathsBlock.lastIndexOf("}");
	if (
		openBraceIndex < 0 ||
		closeBraceIndex < 0 ||
		closeBraceIndex <= openBraceIndex
	) {
		throw new Error("Could not parse paths block body");
	}

	const body = pathsBlock.slice(openBraceIndex + 1, closeBraceIndex);
	const lines = body.split("\n");
	const entries = [];
	let current = null;
	let depth = 0;

	for (const line of lines) {
		const keyMatch = line.match(/^\s*"([^"]+)":\s*{\s*$/);
		if (depth === 0 && keyMatch) {
			if (current) {
				entries.push(current);
			}
			current = {
				pathKey: keyMatch[1],
				lines: [line.replace(/^\s*"[^"]+":\s*/, "")],
			};
			depth += countChar(line, "{") - countChar(line, "}");
			continue;
		}

		if (current) {
			current.lines.push(line);
			depth += countChar(line, "{") - countChar(line, "}");
		}
	}

	if (current) {
		entries.push(current);
	}

	return entries;
}

function splitComponentsBlock(componentsBlock) {
	const schemasStart = componentsBlock.indexOf("schemas:");
	if (schemasStart < 0) {
		throw new Error("Could not find schemas in components block");
	}

	const schemasBraceStart = componentsBlock.indexOf("{", schemasStart);
	if (schemasBraceStart < 0) {
		throw new Error("Could not find schemas opening brace");
	}

	const schemasBraceEnd = findMatchingBrace(
		componentsBlock,
		schemasBraceStart,
	);
	const schemasBody = componentsBlock
		.slice(schemasBraceStart + 1, schemasBraceEnd)
		.trim();

	const afterSchemas = componentsBlock.slice(schemasBraceEnd + 1);
	const firstSemicolon = afterSchemas.indexOf(";");
	if (firstSemicolon < 0) {
		throw new Error("Could not find schemas semicolon");
	}

	const interfaceClose = afterSchemas.lastIndexOf("}");
	if (interfaceClose < 0) {
		throw new Error("Could not find components interface close brace");
	}

	const tail = afterSchemas
		.slice(firstSemicolon + 1, interfaceClose)
		.trimEnd();
	const schemaEntries = splitSchemaEntries(schemasBody);

	return { schemaEntries, tail };
}

function writeComponentsSections(config, componentsBlock) {
	const { schemaEntries, tail } = splitComponentsBlock(componentsBlock);
	const schemaDir = resolve(config.sectionsDir, "components/schemas");
	rmSync(schemaDir, { recursive: true, force: true });
	mkdirSync(schemaDir, { recursive: true });

	for (const entry of schemaEntries) {
		const normalized = dedentLines(entry.lines);
		const body = normalized.join("\n").replace(/;\s*$/, "").trimEnd();

		writeFile(
			resolve(schemaDir, `${entry.name}.ts`),
			[
				"/**",
				` * Generated schema fragment for ${entry.name}.`,
				" * Do not make direct changes to generated output.",
				" */",
				"",
				'import type { components } from "../core";',
				"",
				`export type ${entry.name} = ${body};`,
				"",
			].join("\n"),
		);
	}

	writeFile(
		resolve(config.sectionsDir, "components/schemas/index.ts"),
		[
			"/**",
			" * Generated schema index.",
			" * Do not make direct changes to generated output.",
			" */",
			"",
			...schemaEntries.map(
				(entry) =>
					`import type { ${entry.name} } from "./${entry.name}";`,
			),
			"",
			"export interface GeneratedSchemas {",
			...schemaEntries.map(
				(entry) => `    ${entry.name}: ${entry.name};`,
			),
			"}",
			"",
		].join("\n"),
	);

	writeFile(
		resolve(config.sectionsDir, "components/core.ts"),
		[
			"/**",
			` * This file was split from ${config.entryName}.`,
			" * Do not make direct changes to generated output.",
			" */",
			"",
			'import type { GeneratedSchemas } from "./schemas";',
			"",
			"export interface components {",
			"    schemas: GeneratedSchemas;",
			tail,
			"}",
			"",
		].join("\n"),
	);

	writeFile(
		resolve(config.sectionsDir, "components/index.ts"),
		[
			"/**",
			" * Generated components entry.",
			" * Do not make direct changes to generated output.",
			" */",
			"",
			'export type { components } from "./core";',
			'export type { GeneratedSchemas } from "./schemas";',
			"",
		].join("\n"),
	);
}

function writePathsSections(config, pathsBlock) {
	const entries = splitPathEntries(pathsBlock);
	const routesDir = resolve(config.sectionsDir, "paths/routes");
	rmSync(routesDir, { recursive: true, force: true });
	mkdirSync(routesDir, { recursive: true });

	const routeMetadata = entries.map((entry) => {
		const fileSlug = slugifyRoutePath(entry.pathKey);
		const typeName = `${config.prefix}${toPascalCase(fileSlug)}Path`;
		const body = dedentLines(entry.lines)
			.join("\n")
			.replace(/;\s*$/, "")
			.trimEnd();

		writeFile(
			resolve(routesDir, `${fileSlug}.ts`),
			[
				"/**",
				` * Generated path fragment for ${entry.pathKey}.`,
				" * Do not make direct changes to generated output.",
				" */",
				"",
				'import type { components } from "../../components";',
				"",
				`export type ${typeName} = ${body};`,
				"",
			].join("\n"),
		);

		return {
			pathKey: entry.pathKey,
			fileSlug,
			typeName,
		};
	});

	writeFile(
		resolve(config.sectionsDir, "paths/routes/index.ts"),
		[
			"/**",
			" * Generated path route index.",
			" * Do not make direct changes to generated output.",
			" */",
			"",
			...routeMetadata.map(
				(route) =>
					`import type { ${route.typeName} } from "./${route.fileSlug}";`,
			),
			"",
			"export interface GeneratedPathEntries {",
			...routeMetadata.map(
				(route) => `    "${route.pathKey}": ${route.typeName};`,
			),
			"}",
			"",
		].join("\n"),
	);

	writeFile(
		resolve(config.sectionsDir, "paths/model.ts"),
		[
			"/**",
			` * This file was split from ${config.entryName}.`,
			" * Do not make direct changes to generated output.",
			" */",
			"",
			'import type { GeneratedPathEntries } from "./routes";',
			"",
			"export interface paths extends GeneratedPathEntries {}",
			"",
		].join("\n"),
	);

	writeFile(
		resolve(config.sectionsDir, "paths.ts"),
		[
			"/**",
			" * Generated paths entry.",
			" * Do not make direct changes to generated output.",
			" */",
			"",
			'export type { paths } from "./paths/model";',
			"",
		].join("\n"),
	);
}

function writeGeneratedRootEntry() {
	writeFile(
		resolve(contractsDir, "generated/index.ts"),
		[
			"/**",
			" * Combined generated contract entry.",
			" * Exposes both API and BFF generated contract types.",
			" */",
			"",
			'export type { paths as ApiPaths } from "./api/types.generated";',
			'export type { components as ApiComponents } from "./api/types.generated";',
			'export type { webhooks as ApiWebhooks } from "./api/types.generated";',
			'export type { operations as ApiOperations } from "./api/types.generated";',
			'export type { $defs as ApiDefs } from "./api/types.generated";',
			"",
			'export type { paths as BffPaths } from "./bff/types.bff.generated";',
			'export type { components as BffComponents } from "./bff/types.bff.generated";',
			'export type { webhooks as BffWebhooks } from "./bff/types.bff.generated";',
			'export type { operations as BffOperations } from "./bff/types.bff.generated";',
			'export type { $defs as BffDefs } from "./bff/types.bff.generated";',
			"",
		].join("\n"),
	);
}

function splitTarget(targetKey) {
	const config = targets[targetKey];
	if (!config) {
		throw new Error(`Unknown target: ${targetKey}`);
	}

	const source = generateRawFromSpec(config.specFile);

	const pathsBlock = extractSection(source, markers[0], markers[1]);
	const webhooksBlock = extractSection(source, markers[1], markers[2]);
	const componentsBlock = extractSection(source, markers[2], markers[3]);
	const defsBlock = extractSection(source, markers[3], markers[4]);
	const operationsBlock = extractSection(source, markers[4], null);

	rmSync(config.sectionsDir, { recursive: true, force: true });
	mkdirSync(config.sectionsDir, { recursive: true });

	writePathsSections(config, pathsBlock);

	writeFile(
		resolve(config.sectionsDir, "webhooks.ts"),
		[
			"/**",
			` * This file was split from ${config.entryName}.`,
			" * Do not make direct changes to generated output.",
			" */",
			"",
			webhooksBlock.trimEnd(),
			"",
		].join("\n"),
	);

	writeComponentsSections(config, componentsBlock);

	writeFile(
		resolve(config.sectionsDir, "defs.ts"),
		[
			"/**",
			` * This file was split from ${config.entryName}.`,
			" * Do not make direct changes to generated output.",
			" */",
			"",
			defsBlock.trimEnd(),
			"",
		].join("\n"),
	);

	writeFile(
		resolve(config.sectionsDir, "operations.ts"),
		[
			"/**",
			` * This file was split from ${config.entryName}.`,
			" * Do not make direct changes to generated output.",
			" */",
			"",
			operationsBlock.trimEnd(),
			"",
		].join("\n"),
	);

	writeFile(
		config.entryFile,
		[
			"/**",
			` * Entry file generated from ${config.sourceLabel}.`,
			" * Section files live under ./sections.",
			" * Do not make direct changes to generated output.",
			" */",
			"",
			'export type { paths } from "./sections/paths";',
			'export type { webhooks } from "./sections/webhooks";',
			'export type { components } from "./sections/components";',
			'export type { $defs } from "./sections/defs";',
			'export type { operations } from "./sections/operations";',
			"",
		].join("\n"),
	);

	rmSync(resolve(dirname(config.entryFile), "nested"), {
		recursive: true,
		force: true,
	});

	rmSync(resolve(dirname(config.entryFile), "raw"), {
		recursive: true,
		force: true,
	});

	console.log(`split-generated: ${targetKey} done`);
}

function main() {
	const targetArg = process.argv[2] ?? "all";
	if (targetArg === "all") {
		splitTarget("api");
		splitTarget("bff");
		writeGeneratedRootEntry();
		return;
	}

	splitTarget(targetArg);
	writeGeneratedRootEntry();
}

main();
