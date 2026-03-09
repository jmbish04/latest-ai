# latest-ai

**Live**: https://models.flared.au
**Purpose**: Auto-updating reference page of leading AI models, sourced from OpenRouter API.

## Architecture

Single Cloudflare Worker (`src/index.ts`), no bindings, no database, no framework. Fetches from OpenRouter, filters to leading models, serves in 3 formats.

## Endpoints

| Path | Format | Use |
|------|--------|-----|
| `/` | HTML | Human-readable dark theme page |
| `/llms.txt` | Plain text | AI agent context injection |
| `/json` | JSON | Programmatic use |

**Query params**: `?days=90` (default 90), `?provider=anthropic`

## Filtering

- **Provider whitelist**: anthropic, openai, google, meta-llama, mistralai, deepseek, qwen, x-ai, z-ai, cohere, nvidia
- **Recency**: Last 90 days by default
- **Exclusions**: `:free` wrappers, `:extended` variants, $0/$0 pricing

## Commands

```bash
npm run dev      # Local dev server
npm run deploy   # Deploy to Cloudflare
```

## Key Notes

- **No bindings**: No KV, D1, or R2. Upstream cached via `cf.cacheTtl` (6 hours)
- **Model IDs are OpenRouter IDs**: e.g. `anthropic/claude-opus-4.6` (dots), not direct API IDs like `claude-opus-4-6` (hyphens)
- **Provider whitelist** is a const array at the top of `src/index.ts` — add/remove providers there
