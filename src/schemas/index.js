/**
 * Schema registry.
 *
 * WHY JSON files loaded through fs instead of `import ... with { type: 'json' }`:
 * the schemas are shared artefacts (a linter, a mock server or a contract test
 * in another language may consume them), and reading them by path keeps them
 * plain JSON for those tools. It also avoids relying on JSON import attributes
 * in every runtime that executes these tests.
 */
import { readFileSync } from 'node:fs';

const load = (name) => JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'));

export const productSchema = load('product.schema.json');
export const productListSchema = load('product-list.schema.json');
export const errorSchema = load('error.schema.json');
export const unauthorizedSchema = load('unauthorized.schema.json');

export const allSchemas = [productSchema, productListSchema, errorSchema, unauthorizedSchema];
