const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

const envPath = path.join(__dirname, '..', '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');

function parseEnv(text) {
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function setEnvValue(text, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}="${value}"`;
  if (pattern.test(text)) return text.replace(pattern, line);
  return `${text.trimEnd()}\n${line}\n`;
}

const env = parseEnv(envText);
const currentUrl = env.DATABASE_URL;
if (!currentUrl) {
  console.error('DATABASE_URL missing from .env.local');
  process.exit(1);
}

const match = currentUrl.match(/postgres(?:ql)?:\/\/postgres(?:\.([^:]+))?:([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/);
if (!match) {
  console.error('Could not parse DATABASE_URL');
  process.exit(1);
}

const [, projectRefFromUser, password, , port = '5432', database] = match;
const projectRef = projectRefFromUser || 'ngawamxytyqvtasunwkp';
const sslParams = currentUrl.includes('sslmode=')
  ? currentUrl.slice(currentUrl.indexOf('?'))
  : '?sslmode=verify-full&sslrootcert=./prisma/prod-ca-2021.crt';

const regions = [
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'us-east-1',
  'us-west-1',
];

async function tryUrl(label, url) {
  process.env.DATABASE_URL = url;
  const client = new PrismaClient();
  try {
    const count = await client.listing.count();
    console.log(`${label}: OK (${count} listings)`);
    return true;
  } catch (err) {
    console.log(`${label}: ${err.message.split('\n')[0]}`);
    return false;
  } finally {
    await client.$disconnect();
  }
}

(async () => {
  if (currentUrl.includes('pooler.supabase.com')) {
    console.log('DATABASE_URL already uses Supabase pooler.');
    process.exit(0);
  }

  console.log('Current DATABASE_URL uses direct host (IPv6-only). Testing pooler regions...\n');

  for (const region of regions) {
    const poolerHost = `aws-0-${region}.pooler.supabase.com`;
    const sessionUrl = `postgresql://postgres.${projectRef}:${password}@${poolerHost}:5432/${database}${sslParams}`;
    if (await tryUrl(`session ${region}`, sessionUrl)) {
      const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/${database}${sslParams}`;
      let updated = setEnvValue(envText, 'DATABASE_URL', sessionUrl);
      updated = setEnvValue(updated, 'DIRECT_URL', directUrl);
      fs.writeFileSync(envPath, updated);
      console.log(`\nUpdated .env.local -> DATABASE_URL uses ${poolerHost}:5432`);
      return;
    }

    const txUrl = `postgresql://postgres.${projectRef}:${password}@${poolerHost}:6543/${database}?pgbouncer=true${sslParams.includes('?') ? '&' + sslParams.slice(1) : sslParams}`;
    if (await tryUrl(`transaction ${region}`, txUrl)) {
      const directUrl = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/${database}${sslParams}`;
      let updated = setEnvValue(envText, 'DATABASE_URL', txUrl);
      updated = setEnvValue(updated, 'DIRECT_URL', directUrl);
      fs.writeFileSync(envPath, updated);
      console.log(`\nUpdated .env.local -> DATABASE_URL uses ${poolerHost}:6543`);
      return;
    }
  }

  console.error('\nCould not connect via any Supabase pooler region.');
  console.error('Check Supabase dashboard: project may be paused or password incorrect.');
  process.exit(1);
})();
