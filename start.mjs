import { bootstrapEnv, resolveDataDir } from './build/bootstrap-env.mjs';
import { configureAccess } from './configure-access.mjs';

// Bootstrap secrets before creating a fresh SQLite file. The upstream launcher
// remains responsible for port selection, memory limits, and signal handling.
const env = bootstrapEnv({ quiet: true });
Object.assign(process.env, env);
const open = env.OMNIROUTE_OPEN_ACCESS === 'true';
// INITIAL_PASSWORD otherwise makes upstream startup switch login back on.
if (open) process.env.INITIAL_PASSWORD = '';
configureAccess(resolveDataDir(null, env), { open });
process.env.REQUIRE_API_KEY = String(!open);
console.log(open
  ? '[access] Dashboard login and client API keys are disabled.'
  : '[access] Dashboard login and client API keys are required.');
await import('./dev/run-standalone.mjs');
