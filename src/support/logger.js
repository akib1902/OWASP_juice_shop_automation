/**
 * Minimal, dependency-free logger.
 *
 * WHY not console.log everywhere: when a suite runs 8 workers in CI, unfiltered
 * logs are noise. A single logger gives us (a) a namespaced prefix so a line is
 * attributable to a page object, and (b) an off switch via DEBUG_LOGS, so the
 * default run is quiet and a debugging run is verbose.
 *
 * Deliberately NOT a logging framework: a test framework should not ship a
 * logging stack it doesn't need.
 */
import { env } from '../config/env.js';

const enabled = (namespace) => {
  const filter = process.env.DEBUG_LOGS;
  if (!filter) return false;
  return filter === '*' || filter === 'true' || filter.split(',').some((n) => namespace.startsWith(n.trim()));
};

export function createLogger(namespace) {
  const write = (level, message, meta) => {
    if (!enabled(namespace)) return;
    const suffix = meta === undefined ? '' : ` ${JSON.stringify(meta)}`;
    console.log(`[${level}] [${namespace}] ${message}${suffix}`);
  };
  return {
    debug: (m, meta) => write('debug', m, meta),
    info: (m, meta) => write('info', m, meta),
    warn: (m, meta) => write('warn', m, meta),
    error: (m, meta) => write('error', m, meta),
  };
}

/** Log that fires only when NOT in CI — handy for "what URL am I on" breadcrumbs. */
export const debugLog = (message, meta) => {
  if (enabled('framework') && !env.isCI) {
    console.log(`[debug] ${message}`, meta ?? '');
  }
};
