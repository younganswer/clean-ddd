import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type Edit = {
	start: number;
	end: number;
	replacement: string;
};

type Stats = {
	converted: number;
	skippedOverloadImpl: number;
	skippedAnonymousDefault: number;
	skippedGenerator: number;
	skippedNoBody: number;
	filesChanged: number;
};

const exts = new Set(['.ts', '.tsx']);
const defaultTargets = [
	'../scripts',
	'../test-utils',
	'../../frontend/src/lib',
	'../../frontend/src/app',
	'../../frontend/next.config.ts',
];

const stats: Stats = {
	converted: 0,
	skippedOverloadImpl: 0,
	skippedAnonymousDefault: 0,
	skippedGenerator: 0,
	skippedNoBody: 0,
	filesChanged: 0,
};

const isExcludedPath = (filePath: string): boolean => {
	const normalized = filePath.split(path.sep).join('/');
	if (normalized.includes('/node_modules/')) return true;
	if (normalized.includes('/.next/')) return true;
	if (normalized.includes('/out/')) return true;
	if (normalized.endsWith('.d.ts')) return true;
	if (normalized.endsWith('.generated.ts')) return true;
	if (normalized.endsWith('/packages/contracts/types.generated.ts'))
		return true;
	return false;
};

const collectFiles = (targetPath: string): string[] => {
	if (!fs.existsSync(targetPath)) return [];
	const stat = fs.statSync(targetPath);
	if (stat.isFile()) {
		const ext = path.extname(targetPath);
		if (!exts.has(ext)) return [];
		if (isExcludedPath(targetPath)) return [];
		return [targetPath];
	}

	const result: string[] = [];
	for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
		const fullPath = path.join(targetPath, entry.name);
		if (entry.isDirectory()) {
			if (
				entry.name === 'node_modules' ||
				entry.name === '.next' ||
				entry.name === 'out' ||
				entry.name === 'dist'
			) {
				continue;
			}
			result.push(...collectFiles(fullPath));
			continue;
		}
		if (!entry.isFile()) continue;
		const ext = path.extname(entry.name);
		if (!exts.has(ext)) continue;
		if (isExcludedPath(fullPath)) continue;
		result.push(fullPath);
	}
	return result;
};

const hasOverloadInSameScope = (node: ts.FunctionDeclaration): boolean => {
	if (!node.name || !node.parent) return false;
	const parent = node.parent;
	if (!('statements' in parent) || !Array.isArray(parent.statements))
		return false;

	for (const statement of parent.statements) {
		if (statement === node) break;
		if (!ts.isFunctionDeclaration(statement)) continue;
		if (!statement.name || statement.name.text !== node.name.text) continue;
		if (!statement.body) return true;
	}
	return false;
};

const buildTypeParameters = (
	node: ts.FunctionDeclaration,
	isTsxFile: boolean,
): string => {
	if (!node.typeParameters || node.typeParameters.length === 0) return '';
	const typeParamText = node.typeParameters
		.map((parameter) => parameter.getText())
		.join(', ');
	if (isTsxFile && node.typeParameters.length === 1) {
		return `<${typeParamText},>`;
	}
	return `<${typeParamText}>`;
};

const transformFile = (filePath: string): void => {
	const source = fs.readFileSync(filePath, 'utf8');
	const scriptKind = filePath.endsWith('.tsx')
		? ts.ScriptKind.TSX
		: ts.ScriptKind.TS;
	const sourceFile = ts.createSourceFile(
		filePath,
		source,
		ts.ScriptTarget.Latest,
		true,
		scriptKind,
	);

	const edits: Edit[] = [];
	const isTsxFile = filePath.endsWith('.tsx');

	const visit = (node: ts.Node): void => {
		if (ts.isFunctionDeclaration(node)) {
			if (!node.body) {
				stats.skippedNoBody += 1;
			} else if (node.asteriskToken) {
				stats.skippedGenerator += 1;
			} else if (hasOverloadInSameScope(node)) {
				stats.skippedOverloadImpl += 1;
			} else {
				const isExport = !!node.modifiers?.some(
					(modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
				);
				const isDefault = !!node.modifiers?.some(
					(modifier) =>
						modifier.kind === ts.SyntaxKind.DefaultKeyword,
				);

				if (!node.name) {
					if (isDefault) {
						stats.skippedAnonymousDefault += 1;
					}
				} else {
					const asyncKeyword = node.modifiers?.some(
						(modifier) =>
							modifier.kind === ts.SyntaxKind.AsyncKeyword,
					)
						? 'async '
						: '';

					const typeParams = buildTypeParameters(node, isTsxFile);
					const params = node.parameters
						.map((param) => param.getText())
						.join(', ');
					const returnType = node.type
						? `: ${node.type.getText()}`
						: '';
					const bodyText = node.body.getText();
					const base = `${asyncKeyword}${typeParams}(${params})${returnType} => ${bodyText}`;

					let replacement = '';
					if (isDefault) {
						replacement = `const ${node.name.text} = ${base};\nexport default ${node.name.text};`;
					} else if (isExport) {
						replacement = `export const ${node.name.text} = ${base};`;
					} else {
						replacement = `const ${node.name.text} = ${base};`;
					}

					edits.push({
						start: node.getStart(sourceFile),
						end: node.getEnd(),
						replacement,
					});
					stats.converted += 1;
				}
			}
		}

		ts.forEachChild(node, visit);
	};

	visit(sourceFile);
	if (edits.length === 0) return;

	edits.sort((left, right) => right.start - left.start);
	let next = source;
	for (const edit of edits) {
		next =
			next.slice(0, edit.start) + edit.replacement + next.slice(edit.end);
	}

	if (next !== source) {
		fs.writeFileSync(filePath, next, 'utf8');
		stats.filesChanged += 1;
	}
};

const resolveTargets = (): string[] => {
	const argvTargets = process.argv.slice(2);
	const baseDir = __dirname;
	const targets = argvTargets.length > 0 ? argvTargets : defaultTargets;
	return targets.map((target) => path.resolve(baseDir, target));
};

const main = (): void => {
	const targetPaths = resolveTargets();
	const files = targetPaths.flatMap((targetPath) => collectFiles(targetPath));

	const uniqueFiles = Array.from(new Set(files));
	for (const filePath of uniqueFiles) {
		transformFile(filePath);
	}

	console.log(
		[
			`targets=${targetPaths.length}`,
			`files=${uniqueFiles.length}`,
			`filesChanged=${stats.filesChanged}`,
			`converted=${stats.converted}`,
			`skippedNoBody=${stats.skippedNoBody}`,
			`skippedOverloadImpl=${stats.skippedOverloadImpl}`,
			`skippedGenerator=${stats.skippedGenerator}`,
			`skippedAnonymousDefault=${stats.skippedAnonymousDefault}`,
		].join(' '),
	);
};

main();
