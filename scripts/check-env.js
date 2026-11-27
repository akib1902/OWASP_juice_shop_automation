/**
 * Pre-flight check: is the application under test reachable?
 *
 * WHY: the #1 cause of a red first run is "the app isn't up". Spending 3 seconds
 * here saves reading 20 stack traces. Wire it as the first step of CI.
 *
 * Usage: npm run check:env
 */
import { env } from '../src/config/env.js';

const checks = [
  { name: 'UI', url: `${env.baseURL}/` },
  { name: 'API products', url: `${env.apiURL}/api/Products` },
];

let failures = 0;

for (const check of checks) {
  try {
    const response = await fetch(check.url, { method: 'GET' });
    const ok = response.ok;
    if (!ok) failures += 1;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${check.name.padEnd(14)} ${response.status} ${check.url}`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL ${check.name.padEnd(14)} ${error.message} ${check.url}`);
  }
}

console.log(`\nbaseURL: ${env.baseURL}`);
console.log(`apiURL:  ${env.apiURL}`);
console.log(`retries: ${env.retries}   workers: ${env.workers ?? 'auto'}`);

if (failures > 0) {
  console.error('\nEnvironment is not ready. Start the app, e.g.:');
  console.error('  docker run --rm -p 3000:3000 bkimminich/juice-shop');
  process.exit(1);
}
console.log('\nEnvironment looks good.');
