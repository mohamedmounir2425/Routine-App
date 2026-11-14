import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { boundaryError, stylesheetError } from './space-boundaries.mjs';

const root = process.cwd();
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile).config;
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
const files = fs.readdirSync('src', { recursive: true }).filter(file => /\.tsx?$/.test(file));
let errors = 0;
for (const file of files) {
  const importer = path.resolve('src', file);
  const source = ts.createSourceFile(importer, fs.readFileSync(importer, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = node => {
    let specifier;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) specifier = node.moduleSpecifier;
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) specifier = node.arguments[0];
    if (specifier && ts.isStringLiteral(specifier)) {
      const resolved = ts.resolveModuleName(specifier.text, importer, options, ts.sys).resolvedModule?.resolvedFileName;
      // TypeScript does not resolve stylesheet side-effect imports.
      const target = resolved ?? (specifier.text.startsWith('.') ? path.resolve(path.dirname(importer), specifier.text) : null);
      const message = target && boundaryError(importer, target);
      if (message) {
        const line = source.getLineAndCharacterOfPosition(specifier.getStart(source)).line + 1;
        console.error(`${path.relative(root, importer)}:${line}: ${message}`);
        errors += 1;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
for (const file of fs.readdirSync('src', { recursive: true }).filter(file => file.endsWith('.css'))) {
  const relative = `src/${file.replaceAll('\\', '/')}`;
  const message = stylesheetError(relative, fs.readFileSync(relative, 'utf8'));
  if (message) { console.error(`${relative}: ${message}`); errors += 1; }
}
if (errors) process.exitCode = 1;
else console.log(`Space boundaries checked (${files.length} source files).`);
