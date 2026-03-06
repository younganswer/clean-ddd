import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contractsDir = resolve(__dirname, "..");

const specTargets = [
	{
		name: "api",
		baseDir: resolve(contractsDir, "specs/api"),
		pathsFile: resolve(contractsDir, "specs/api/paths.yaml"),
		componentsFile: resolve(contractsDir, "specs/api/components.yaml"),
	},
	{
		name: "bff",
		baseDir: resolve(contractsDir, "specs/bff"),
		pathsFile: resolve(contractsDir, "specs/bff/paths.yaml"),
		componentsFile: resolve(contractsDir, "specs/bff/components.yaml"),
	},
];

function normalizeLines(text) {
	return text.replace(/\r\n/g, "\n").split("\n");
}

function leadingSpaces(line) {
	const match = line.match(/^(\s*)/);
	return match ? match[1].length : 0;
}

function dedent(lines) {
	const nonEmpty = lines.filter((line) => line.trim().length > 0);
	if (nonEmpty.length === 0) {
		return lines;
	}

	const minIndent = Math.min(...nonEmpty.map((line) => leadingSpaces(line)));
	return lines.map((line) => {
		if (line.trim().length === 0) {
			return "";
		}
		return line.slice(minIndent);
	});
}

function slugifyPath(routePath) {
	if (routePath === "/") {
		return "root";
	}

	const slug = routePath
		.replace(/^\//, "")
		.split("/")
		.map((segment) =>
			segment
				.replace(/[{}]/g, "")
				.replace(/[^A-Za-z0-9_-]+/g, "-")
				.replace(/^-+|-+$/g, ""),
		)
		.filter((segment) => segment.length > 0)
		.join("__");

	return slug.length > 0 ? slug : "route";
}

function splitPaths(pathsFile, outputDir) {
	const lines = normalizeLines(readFileSync(pathsFile, "utf8"));
	const entries = [];

	let current = null;
	for (const line of lines) {
		const match = line.match(/^\s{4}(\/[^:]*):\s*$/);
		if (match) {
			if (current) {
				entries.push(current);
			}
			current = {
				pathKey: match[1],
				lines: [line],
			};
			continue;
		}

		if (current) {
			current.lines.push(line);
		}
	}

	if (current) {
		entries.push(current);
	}

	if (entries.length === 0) {
		throw new Error(`No path entries found in ${pathsFile}`);
	}

	rmSync(outputDir, { recursive: true, force: true });
	mkdirSync(outputDir, { recursive: true });

	const usedNames = new Map();
	const indexLines = [];

	for (const entry of entries) {
		const baseName = slugifyPath(entry.pathKey);
		const count = usedNames.get(baseName) ?? 0;
		usedNames.set(baseName, count + 1);
		const fileName =
			count === 0 ? `${baseName}.yaml` : `${baseName}-${count + 1}.yaml`;

		const bodyLines = dedent(entry.lines.slice(1)).map((line) =>
			line.replace(
				/#\/components\/schemas\//g,
				"../components.yaml#/schemas/",
			),
		);
		const targetPath = join(outputDir, fileName);
		writeFileSync(targetPath, `${bodyLines.join("\n")}\n`, "utf8");

		indexLines.push(`"${entry.pathKey}":`);
		indexLines.push(`    $ref: "./paths/${fileName}"`);
	}

	writeFileSync(pathsFile, `${indexLines.join("\n")}\n`, "utf8");

	return entries.length;
}

function splitComponents(componentsFile, outputDir) {
	const lines = normalizeLines(readFileSync(componentsFile, "utf8"));
	const schemasLineIndex = lines.findIndex((line) =>
		/^\s{4}schemas:\s*$/.test(line),
	);

	if (schemasLineIndex < 0) {
		throw new Error(`Could not find schemas block in ${componentsFile}`);
	}

	const entries = [];
	let current = null;

	for (let i = schemasLineIndex + 1; i < lines.length; i += 1) {
		const line = lines[i];
		const match = line.match(/^\s{8}([A-Za-z0-9_]+):\s*$/);
		if (match) {
			if (current) {
				entries.push(current);
			}
			current = {
				schemaName: match[1],
				lines: [line],
			};
			continue;
		}

		if (current) {
			current.lines.push(line);
		}
	}

	if (current) {
		entries.push(current);
	}

	if (entries.length === 0) {
		throw new Error(`No schema entries found in ${componentsFile}`);
	}

	rmSync(outputDir, { recursive: true, force: true });
	mkdirSync(outputDir, { recursive: true });

	const indexLines = ["schemas:"];

	for (const entry of entries) {
		const fileName = `${entry.schemaName}.yaml`;
		const bodyLines = dedent(entry.lines.slice(1)).map((line) =>
			line.replace(
				/#\/components\/schemas\//g,
				"../../components.yaml#/schemas/",
			),
		);
		const targetPath = join(outputDir, fileName);
		writeFileSync(targetPath, `${bodyLines.join("\n")}\n`, "utf8");

		indexLines.push(`    ${entry.schemaName}:`);
		indexLines.push(`        $ref: "./components/schemas/${fileName}"`);
	}

	writeFileSync(componentsFile, `${indexLines.join("\n")}\n`, "utf8");

	return entries.length;
}

function main() {
	for (const target of specTargets) {
		const pathCount = splitPaths(
			target.pathsFile,
			resolve(target.baseDir, "paths"),
		);
		const schemaCount = splitComponents(
			target.componentsFile,
			resolve(target.baseDir, "components/schemas"),
		);

		console.log(
			`[${target.name}] paths=${pathCount}, schemas=${schemaCount}`,
		);
	}
}

main();
