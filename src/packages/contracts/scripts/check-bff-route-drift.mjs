import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const contractsDir = process.cwd();
const backendBffDir = resolve(contractsDir, "../../service/backend/src/bff");
const specPathsIndexPath = resolve(contractsDir, "specs/bff/paths.yaml");
const specPathsDir = resolve(contractsDir, "specs/bff/paths");

function walk(dir) {
	const entries = readdirSync(dir);
	const files = [];
	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			files.push(...walk(fullPath));
			continue;
		}
		if (entry.endsWith(".controller.ts")) {
			files.push(fullPath);
		}
	}
	return files;
}

function toSpecStylePath(path) {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return normalized.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

function joinRoute(basePath, methodPath) {
	const normalizedBase = basePath.replace(/^\/+|\/+$/g, "");
	const normalizedMethod = (methodPath ?? "").replace(/^\/+|\/+$/g, "");
	if (!normalizedMethod) {
		return toSpecStylePath(`/${normalizedBase}`);
	}
	return toSpecStylePath(`/${normalizedBase}/${normalizedMethod}`);
}

function extractBackendRoutes(filePath) {
	const source = readFileSync(filePath, "utf8");
	const controllerMatch = source.match(/@Controller\('([^']+)'\)/);
	if (!controllerMatch) {
		return [];
	}
	const base = controllerMatch[1];
	const methodRegex = /@(Get|Post|Put|Patch|Delete)\((?:'([^']*)')?\)/g;
	const routes = [];
	let match;
	while ((match = methodRegex.exec(source)) !== null) {
		const method = match[1].toUpperCase();
		const subPath = match[2] ?? "";
		routes.push(`${method} ${joinRoute(base, subPath)}`);
	}
	return routes;
}

function extractSpecRoutes(pathsIndexFilePath, pathsDirectoryPath) {
	const source = readFileSync(pathsIndexFilePath, "utf8");
	const lines = source.split("\n");
	const routes = [];

	let currentPath = null;
	for (const line of lines) {
		const pathMatch = line.match(/^\s*"?(\/bff\/[^"']+)"?:\s*$/);
		if (pathMatch) {
			currentPath = pathMatch[1];
			continue;
		}
		if (!currentPath) {
			continue;
		}

		const refMatch = line.match(/^\s*\$ref:\s*"\.\/paths\/([^"]+)"\s*$/);
		if (!refMatch) {
			continue;
		}

		const pathFilePath = resolve(pathsDirectoryPath, refMatch[1]);
		const pathFileSource = readFileSync(pathFilePath, "utf8");
		for (const pathLine of pathFileSource.split("\n")) {
			const methodMatch = pathLine.match(
				/^\s*(get|post|put|patch|delete):\s*$/,
			);
			if (methodMatch) {
				routes.push(`${methodMatch[1].toUpperCase()} ${currentPath}`);
			}
		}

		currentPath = null;
	}

	return routes;
}

const backendFiles = walk(backendBffDir);
const backendRoutes = new Set(
	backendFiles.flatMap((filePath) => extractBackendRoutes(filePath)),
);
const specRoutes = new Set(extractSpecRoutes(specPathsIndexPath, specPathsDir));

const missingInSpec = [...backendRoutes]
	.filter((route) => !specRoutes.has(route))
	.sort();
const missingInBackend = [...specRoutes]
	.filter((route) => !backendRoutes.has(route))
	.sort();

if (missingInSpec.length === 0 && missingInBackend.length === 0) {
	console.log("BFF route drift check passed.");
	process.exit(0);
}

console.error("BFF route drift detected.");
if (missingInSpec.length > 0) {
	console.error("\nMissing in specs/bff/paths.yaml:");
	for (const route of missingInSpec) {
		console.error(`- ${route}`);
	}
}
if (missingInBackend.length > 0) {
	console.error("\nMissing in backend controllers:");
	for (const route of missingInBackend) {
		console.error(`- ${route}`);
	}
}

process.exit(1);
