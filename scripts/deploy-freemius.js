/**
 * deploy-freemius.js
 *
 * Uploads the built plugin ZIP to Freemius via the REST API.
 *
 * Auth scheme — developer scope (FSA):
 *   string_to_sign = METHOD + "\n" + content_md5 + "\n" + content_type_with_boundary + "\n" + date + "\n" + resource_url
 *   hex_hash       = HmacSHA256( string_to_sign, secret_key ) → hex string  (same as CryptoJS .toString())
 *   signature      = base64_strip_padding( hex_hash )          (strip = only; keep + and / like gulp-freemius-deploy)
 *   Authorization  = "FSA {dev_id}:{public_key}:{signature}"
 *
 * "FSA" is the developer-scope prefix. "FS" is for plugin/user scope and is rejected with
 * "Invalid Authorization header" when used with developer credentials.
 *
 * Required environment variables:
 *   FREEMIUS_DEVELOPER_ID  — numeric developer ID (freemius.com → My Profile)
 *   FREEMIUS_PUBLIC_KEY    — starts with pk_...
 *   FREEMIUS_SECRET_KEY    — starts with sk_...
 *   FREEMIUS_PLUGIN_ID     — numeric plugin ID (freemius.com → plugin → API tab)
 *   ZIP_PATH               — path to the built .zip file
 *   RELEASE_MODE           — "pending" (draft) or "released" (live). Default: pending
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir   = path.resolve(__dirname, '..');
const envFile   = path.resolve(rootDir, '.env');
if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        // Strip optional leading "export " (shell syntax)
        const stripped = trimmed.replace(/^export\s+/, '');
        const eq = stripped.indexOf('=');
        if (eq === -1) continue;
        const key = stripped.slice(0, eq).trim();
        const val = stripped.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (key) process.env[key] = val;
    }
}

const DEVELOPER_ID = (process.env.FREEMIUS_DEVELOPER_ID || '').trim();
const PUBLIC_KEY   = (process.env.FREEMIUS_PUBLIC_KEY   || '').trim();
const SECRET_KEY   = (process.env.FREEMIUS_SECRET_KEY   || '').trim();
const PLUGIN_ID    = (process.env.FREEMIUS_PLUGIN_ID    || '').trim();
const ZIP_PATH     = (process.env.ZIP_PATH              || path.resolve(rootDir, 'ninja-media.zip')).trim();
const RELEASE_MODE = (process.env.RELEASE_MODE          || 'pending').trim();

const missing = ['FREEMIUS_DEVELOPER_ID', 'FREEMIUS_PUBLIC_KEY', 'FREEMIUS_SECRET_KEY', 'FREEMIUS_PLUGIN_ID']
  .filter(k => !(process.env[k] || '').trim());

if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

console.log('→ Dev ID   :', DEVELOPER_ID);
console.log('→ Plugin ID:', PLUGIN_ID);
console.log('→ Pub key  :', PUBLIC_KEY);
console.log('→ Sec key  :', SECRET_KEY.slice(0, 6) + '...' + SECRET_KEY.slice(-4), `(${SECRET_KEY.length} chars)`);

if (!fs.existsSync(ZIP_PATH)) {
  console.error(`❌ ZIP file not found: ${ZIP_PATH}`);
  process.exit(1);
}

/**
 * Build the FSA Authorization header (developer scope).
 *
 * Freemius PHP SDK signs with empty content-type and empty content-md5 for
 * multipart uploads because cURL auto-sets the Content-Type (with boundary)
 * after the auth params are already computed.
 *
 * string_to_sign = "POST\n\n\n{date}\n{resource_url}"
 * signature      = base64( hmac_sha256( string_to_sign, secret_key ) )   [= digest('base64')]
 */
// Freemius PHP SDK canonical path: "{developer_id}:{plugin_id}:{relative_path}"
// e.g. tags endpoint → "17740:28374:tags.json"
// e.g. plugin info  → "17740:28374:"
// e.g. developer    → "17740:"
function buildAuthHeader(method, date, resourcePath) {
  // Try every known Freemius signing-path variant and log them all so we can
  // spot which one matches when the error changes.
  const variants = [
    ['full+v1',         resourcePath],
    ['no-v1',           resourcePath.replace(/^\/v1/, '')],
    ['dev:plugin:rel',  `${DEVELOPER_ID}:${PLUGIN_ID}:` + resourcePath.replace(/^.*tags\.json/, 'tags.json').replace(/^.*\.json$/, '.json')],
    ['pub-only-full',   resourcePath],   // used for FS {pub}:{sig} variant below
  ];

  const results = variants.map(([label, sigPath]) => {
    const sts = [method.toUpperCase(), '', '', date, sigPath].join('\n');
    const sig = crypto.createHmac('sha256', SECRET_KEY).update(sts).digest('base64').replace(/=+$/, '');
    return { label, sigPath, sig };
  });

  // Log all variants so we can compare
  results.forEach(({ label, sigPath }) =>
    console.log(`   [${label}] signing: ${sigPath}`)
  );

  // Active variant: full path with /v1, header format FSA {pub_key}:{sig} (no dev_id)
  const active = results[0];
  console.log(`→ active variant: ${active.label}`);
  return `FSA ${PUBLIC_KEY}:${active.sig}`;
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, json: null, raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Verify credentials with a lightweight GET before uploading anything
async function verifyCredentials(date) {
  const pluginApiPath = `/v1/developers/${DEVELOPER_ID}/plugins/${PLUGIN_ID}.json`;
  const auth = buildAuthHeader('GET', date, pluginApiPath);
  console.log(`→ Checking credentials (${pluginApiPath})...`);
  const { status, json } = await httpRequest({
    hostname: 'api.freemius.com', path: pluginApiPath, method: 'GET',
    headers: { 'Authorization': auth, 'Date': date },
  });
  console.log(`   status: ${status}`, JSON.stringify(json?.error || json?.id || json?.slug || ''));
  if (status === 401) {
    console.error('❌ Credential check failed — signing path or keys are wrong.');
    process.exit(1);
  }
}

function buildMultipart(boundary, zipPath, releaseMode) {
  const fileBuffer = fs.readFileSync(zipPath);
  const fileName   = path.basename(zipPath);

  const field = (name, value) => Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
    `${value}\r\n`
  );

  const filePart = (name, filename, buffer) => Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n` +
      `Content-Type: application/zip\r\n\r\n`
    ),
    buffer,
    Buffer.from('\r\n'),
  ]);

  return Buffer.concat([
    field('add_contributor', 'false'),
    field('release_mode', releaseMode),
    filePart('file', fileName, fileBuffer),
    Buffer.from(`--${boundary}--\r\n`),
  ]);
}

async function deploy() {
  const resourceUrl = `/v1/developers/${DEVELOPER_ID}/plugins/${PLUGIN_ID}/tags.json`;
  const boundary    = `----${Date.now().toString(16)}`;

  // Match PHP gmdate('D, d M Y H:i:s +0000') format exactly
  const now    = new Date();
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad    = n => String(n).padStart(2, '0');
  const date   = `${days[now.getUTCDay()]}, ${pad(now.getUTCDate())} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} +0000`;

  const contentType = `multipart/form-data; boundary=${boundary}`;

  await verifyCredentials(date);

  const body          = buildMultipart(boundary, ZIP_PATH, RELEASE_MODE);
  const authorization = buildAuthHeader('POST', date, resourceUrl);

  console.log(`→ Uploading ${path.basename(ZIP_PATH)} (${(body.length / 1024).toFixed(1)} KB)`);
  console.log(`→ Endpoint : https://api.freemius.com${resourceUrl}`);
  console.log(`→ Mode     : ${RELEASE_MODE}`);

  const { status, json } = await httpRequest({
    hostname: 'api.freemius.com',
    path: resourceUrl,
    method: 'POST',
    headers: {
      'Authorization':  authorization,
      'Date':           date,
      'Content-Type':   contentType,
      'Content-Length': body.length,
    },
  }, body);

  if (!json) {
    console.error('❌ Could not parse Freemius response');
    process.exit(1);
  }

  if (json.error) {
    console.error('❌ Freemius API error:', json.error.message || JSON.stringify(json.error));
    process.exit(1);
  }

  if (!json.id) {
    console.error('❌ Unexpected response:', JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log('✅ Deployed successfully to Freemius!');
  console.log(`   Version : ${json.version}`);
  console.log(`   Tag ID  : ${json.id}`);
  console.log(`   Mode    : ${json.release_mode}`);
  console.log(`   URL     : https://freemius.com/dashboard/developer/${DEVELOPER_ID}/plugins/${PLUGIN_ID}/versions/`);
}

deploy();
