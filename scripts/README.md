# Scripts

## Demo content import

Populate the CMS with demo articles from `content/demo-content.csv`.

### CSV → Article mapping

| CSV column   | Article field | Notes                          |
|-------------|---------------|---------------------------------|
| `uri`       | `articleId`, `uri` | Required; used as unique UID   |
| `lang`      | `lang`        | e.g. `eng`                      |
| `dateTimePub` | `datetimePub` | ISO datetime                   |
| `url`       | `sourceUri`   | Source article URL              |
| `title`     | `title`       | Required                        |
| `body`      | `fullStory`   | Full text; first 300 chars → `summary` |
| `imageUri`  | `imageUri`    | Image URL                       |
| `source`    | —             | Not stored (domain name)        |

### Usage

1. Start the CMS: `yarn dev` (or `npm run dev`).
2. Ensure the Article content-type has **create** permission for the Public role (or use an API token with create permission).
3. Run the import:

```bash
# Import all rows (default CSV: content/demo-content.csv)
yarn import-demo

# Or with node
node scripts/import-demo-content.mjs
```

### Options

- **`--dry-run`** – Log what would be created without calling the API.
- **`--limit N`** – Import only the first N rows (e.g. `--limit 10`).

### Environment

| Variable           | Default                 | Description                    |
|--------------------|-------------------------|--------------------------------|
| `STRAPI_URL`       | `http://localhost:1337` | Strapi base URL                |
| `STRAPI_API_TOKEN` | (none)                  | Optional; use for auth         |
| `CSV_PATH`         | `content/demo-content.csv` | Path to CSV (from project root) |

### Examples

```bash
# Dry run, first 5 rows
yarn import-demo --dry-run --limit 5

# Import to a remote CMS with token
STRAPI_URL=https://cms.example.com STRAPI_API_TOKEN=xxx yarn import-demo

# Custom CSV path
CSV_PATH=/path/to/other.csv yarn import-demo
```

Re-running the import will create duplicate articles (same `articleId` will cause Strapi to return an error for those rows). To re-populate from scratch, clear existing articles in the Admin UI or via the API first.
