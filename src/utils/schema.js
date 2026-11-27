/**
 * JSON-Schema validation (contract testing).
 *
 * WHY schemas in a UI framework: the API tests exist to catch *contract* drift
 * (a field renamed, a type changed, an error shape replaced by an HTML page).
 * Asserting "200 and non-empty" cannot see that; a schema can.
 *
 * All schemas are registered up-front so `$ref` between them
 * (product-list -> product) resolves regardless of compile order — a subtle
 * Ajv trap that otherwise only appears when tests run in a different order.
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { createLogger } from '../support/logger.js';
import { allSchemas } from '../schemas/index.js';

const log = createLogger('schema');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
allSchemas.forEach((schema) => {
  if (!ajv.getSchema(schema.$id)) ajv.addSchema(schema);
});

/**
 * Validate `data` against `schema` and return the list of violations.
 * An empty array means valid, so callers can write:
 *   expect(validateAgainstSchema(productSchema, body)).toEqual([])
 */
export function validateAgainstSchema(schema, data) {
  const validate = ajv.getSchema(schema.$id) ?? ajv.compile(schema);
  const valid = validate(data);
  if (valid) return [];
  log.debug('schema violation', validate.errors);
  return (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`.trim());
}

/** Throwing wrapper for cases where invalid data should abort a helper immediately. */
export function assertSchema(schema, data, label = 'payload') {
  const errors = validateAgainstSchema(schema, data);
  if (errors.length) {
    throw new Error(`${label} does not match its JSON schema:\n - ${errors.join('\n - ')}`);
  }
  return data;
}
