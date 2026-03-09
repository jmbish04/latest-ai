# Latest AI Models

A live reference page of leading AI models from major providers, auto-updated from the [OpenRouter API](https://openrouter.ai/docs/api-reference/list-available-models).

**Live at [models.flared.au](https://models.flared.au)**

## Why

AI agents need current model IDs. Model names change constantly — new versions launch, old ones deprecate. Instead of maintaining a static list, this page fetches the latest data and filters it down to what matters.

Point your AI agent here:

```
For current AI model IDs and pricing, fetch https://models.flared.au/llms.txt
```

## Formats

| URL | Format | Best for |
|-----|--------|----------|
| [models.flared.au](https://models.flared.au) | HTML | Humans |
| [models.flared.au/llms.txt](https://models.flared.au/llms.txt) | Plain text | AI agent context |
| [models.flared.au/json](https://models.flared.au/json) | JSON | Programmatic use |

## Filtering

Not every model on OpenRouter is useful. This page filters ~350 models down to ~40 leading ones:

- **Provider whitelist**: Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek, Qwen, xAI, Zhipu, Cohere, NVIDIA
- **Recency**: Last 90 days by default (override with `?days=180`)
- **Flagship system**: Each provider's current lineup (e.g. Claude Opus/Sonnet/Haiku, Gemini Pro/Flash/Flash Lite) is always shown regardless of age
- **Exclusions**: Free wrappers, extended variants, $0 pricing

### Query parameters

| Param | Example | Description |
|-------|---------|-------------|
| `days` | `?days=180` | Override the recency cutoff (default: 90) |
| `provider` | `?provider=anthropic` | Filter to a single provider |

## How it works

A single [Cloudflare Worker](https://developers.cloudflare.com/workers/) (~250 lines of TypeScript) that:

1. Fetches from the OpenRouter models API
2. Caches at the edge for 6 hours
3. Filters to leading models using the provider whitelist + flagship patterns + recency cutoff
4. Renders the response in your chosen format

No database, no cron jobs, no framework. The entire app is one file: [`src/index.ts`](src/index.ts).

## Development

```bash
npm install
npm run dev      # Local dev server on :8787
npm run deploy   # Deploy to Cloudflare
```

## Adding a provider

Edit the `PROVIDERS` array and optionally add flagship patterns in `FLAGSHIPS` at the top of `src/index.ts`.

## License

MIT
