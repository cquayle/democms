#!/usr/bin/env node
/**
 * Demo content import script
 *
 * Imports content/demo-content.csv into the CMS Articles collection via the Strapi REST API.
 * Run anytime to populate the CMS for demo purposes.
 *
 * CSV → Article mapping:
 *   uri        → articleId (uid), uri
 *   lang       → lang
 *   dateTimePub→ datetimePub
 *   url        → sourceUri
 *   title      → title
 *   body       → fullStory; first 300 chars → summary
 *   source     → (not stored; optional could add to summary)
 *   imageUri   → imageUri
 *
 * Prerequisites:
 *   - CMS server running (e.g. yarn dev in democms)
 *   - Article create permission for API token or public role
 *
 * Usage:
 *   yarn import-demo
 *   STRAPI_URL=http://localhost:1337 STRAPI_API_TOKEN=your-token yarn import-demo
 *   yarn import-demo --dry-run
 *   yarn import-demo --limit 10
 *
 * Env:
 *   STRAPI_URL       Base URL of Strapi (default: http://localhost:1337)
 *   STRAPI_API_TOKEN Optional API token for authenticated requests
 *   CSV_PATH         Path to CSV (default: content/demo-content.csv)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const STRAPI_URL = (process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const CSV_PATH = process.env.CSV_PATH || join(PROJECT_ROOT, 'content', 'demo-content.csv');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 && args[limitIdx + 1] ? parseInt(args[limitIdx + 1], 10) : null;

/**
 * Map CSV row to Strapi Article payload.
 * Schema: articleId (uid), lang, datetimePub, uri, title, sourceUri, imageUri, summary, fullStory
 */
function mapRowToArticle(row) {
  const body = (row.body || '').trim();
  const summary = body.length > 300 ? body.slice(0, 297).trim() + '...' : body;
  return {
    articleId: String(row.uri || '').trim() || undefined,
    lang: (row.lang || '').trim() || undefined,
    datetimePub: (row.dateTimePub || '').trim() || null,
    uri: (row.uri || '').trim() || undefined,
    title: (row.title || '').trim() || undefined,
    sourceUri: (row.url || '').trim() || undefined,
    imageUri: (row.imageUri || '').trim() || undefined,
    summary: summary || undefined,
    fullStory: body || undefined,
  };
}

async function createArticle(data) {
  const url = `${STRAPI_URL}/api/articles`;
  const headers = {
    'Content-Type': 'application/json',
    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

async function main() {
  let records;
  try {
    let csvContent = readFileSync(CSV_PATH, 'utf8');
    if (csvContent.charCodeAt(0) === 0xfeff) csvContent = csvContent.slice(1);
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
  } catch (e) {
    console.error('Failed to read or parse CSV:', e.message);
    process.exit(1);
  }

  const toProcess = limit !== null ? records.slice(0, limit) : records;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`Importing ${toProcess.length} rows from ${CSV_PATH} to ${STRAPI_URL}/api/articles`);
  if (dryRun) console.log('(dry-run: no requests sent)\n');

  for (let i = 0; i < toProcess.length; i++) {
    const row = toProcess[i];
    const data = mapRowToArticle(row);
    if (!data.articleId || !data.title) {
      console.warn(`[skip row ${i + 1}] missing articleId or title`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${data.articleId}: ${(data.title || '').slice(0, 50)}...`);
      created++;
      continue;
    }

    const { ok, status, body } = await createArticle(data);
    if (ok) {
      created++;
      if (created <= 5 || created % 100 === 0) {
        console.log(`Created ${created}: ${data.articleId}`);
      }
    } else {
      errors++;
      console.error(`Failed ${data.articleId} (${status}): ${body.slice(0, 200)}`);
    }
  }

  console.log(`\nDone. Processed: ${toProcess.length}, created: ${created}, skipped: ${skipped}, errors: ${errors}`);
  if (dryRun) console.log('(dry-run: no changes made)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
