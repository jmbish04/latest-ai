// Latest AI Models — models.flared.au
// Fetches from OpenRouter API, filters to leading models, serves in 3 formats.

const PROVIDERS = [
	'anthropic',
	'openai',
	'google',
	'meta-llama',
	'mistralai',
	'deepseek',
	'qwen',
	'x-ai',
	'cohere',
	'nvidia',
] as const;

const DEFAULT_DAYS = 90;
const CACHE_TTL = 21600; // 6 hours in seconds
const OPENROUTER_API = 'https://openrouter.ai/api/v1/models';

// --- Types ---

interface OpenRouterModel {
	id: string;
	name: string;
	created: number;
	context_length: number;
	pricing: { prompt: string; completion: string };
	architecture: { modality: string; input_modalities: string[]; output_modalities: string[] };
	top_provider?: { max_completion_tokens?: number };
}

interface FilteredModel {
	id: string;
	name: string;
	provider: string;
	context_length: number;
	max_output: number | null;
	pricing: { input: number; output: number };
	modality: string;
	released: string;
}

// --- Fetch & Filter ---

async function fetchModels(days: number, providerFilter?: string): Promise<{ models: FilteredModel[]; updated: string }> {
	const resp = await fetch(OPENROUTER_API, { cf: { cacheTtl: CACHE_TTL } } as RequestInit);
	if (!resp.ok) throw new Error(`OpenRouter API error: ${resp.status}`);

	const data = (await resp.json()) as { data: OpenRouterModel[] };
	const cutoff = Date.now() / 1000 - days * 86400;

	const filtered = data.data
		.filter((m) => {
			const provider = m.id.split('/')[0];
			if (!PROVIDERS.includes(provider as (typeof PROVIDERS)[number])) return false;
			if (providerFilter && provider !== providerFilter) return false;
			if (m.created < cutoff) return false;
			if (m.id.includes(':free')) return false;
			if (m.id.includes(':extended')) return false;
			if (m.pricing.prompt === '0' && m.pricing.completion === '0') return false;
			return true;
		})
		.map((m) => ({
			id: m.id,
			name: m.name,
			provider: m.id.split('/')[0],
			context_length: m.context_length,
			max_output: m.top_provider?.max_completion_tokens ?? null,
			pricing: {
				input: parseFloat(m.pricing.prompt) * 1_000_000,
				output: parseFloat(m.pricing.completion) * 1_000_000,
			},
			modality: m.architecture?.modality ?? 'text->text',
			released: new Date(m.created * 1000).toISOString().split('T')[0],
		}))
		.sort((a, b) => {
			if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
			return b.pricing.input - a.pricing.input;
		});

	return { models: filtered, updated: new Date().toISOString() };
}

// --- Formatters ---

function formatTokens(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
	return `${n}`;
}

function formatPrice(perMillion: number): string {
	if (perMillion === 0) return 'Free';
	if (perMillion < 0.01) return `$${perMillion.toFixed(4)}`;
	return `$${perMillion.toFixed(2)}`;
}

// --- Renderers ---

function renderText(models: FilteredModel[], updated: string, days: number): string {
	const lines: string[] = [
		'# Latest AI Models',
		`# Source: OpenRouter API | Updated: ${updated}`,
		`# Filter: ${PROVIDERS.length} providers, last ${days} days | Total: ${models.length} models`,
		`# URL: https://models.flared.au/llms.txt`,
		'',
	];

	let currentProvider = '';
	for (const m of models) {
		if (m.provider !== currentProvider) {
			currentProvider = m.provider;
			lines.push(`## ${currentProvider}`, '');
		}
		lines.push(m.id);
		const ctx = formatTokens(m.context_length);
		const out = m.max_output ? ` | Output: ${formatTokens(m.max_output)}` : '';
		lines.push(`  Context: ${ctx}${out}`);
		lines.push(`  Pricing: ${formatPrice(m.pricing.input)} / ${formatPrice(m.pricing.output)} per 1M tokens`);
		lines.push(`  Modality: ${m.modality}`);
		lines.push(`  Released: ${m.released}`);
		lines.push('');
	}

	return lines.join('\n');
}

function renderJSON(models: FilteredModel[], updated: string, days: number): string {
	return JSON.stringify(
		{
			updated,
			filter: { providers: [...PROVIDERS], days },
			total: models.length,
			models,
		},
		null,
		2
	);
}

function renderHTML(models: FilteredModel[], updated: string, days: number): string {
	let rows = '';
	let currentProvider = '';

	for (const m of models) {
		if (m.provider !== currentProvider) {
			currentProvider = m.provider;
			rows += `<tr><td colspan="5" class="provider">${esc(currentProvider)}</td></tr>\n`;
		}
		const ctx = formatTokens(m.context_length);
		const out = m.max_output ? formatTokens(m.max_output) : '-';
		rows += `<tr>
<td class="id">${esc(m.id)}</td>
<td>${ctx}</td>
<td>${out}</td>
<td>${formatPrice(m.pricing.input)} / ${formatPrice(m.pricing.output)}</td>
<td>${m.released}</td>
</tr>\n`;
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Latest AI Models</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0a0a0a;color:#e5e5e5;padding:2rem;max-width:1100px;margin:0 auto;font-size:14px}
h1{font-size:1.4rem;margin-bottom:.25rem;color:#fff}
.meta{color:#737373;margin-bottom:1.5rem;font-size:13px}
.meta a{color:#737373}
table{width:100%;border-collapse:collapse}
th{text-align:left;padding:.5rem .75rem;border-bottom:1px solid #262626;color:#a3a3a3;font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
td{padding:.4rem .75rem;border-bottom:1px solid #171717}
.provider{font-weight:700;color:#fff;padding-top:1.2rem;font-size:15px;border-bottom:1px solid #262626}
.id{color:#60a5fa}
tr:hover td:not(.provider){background:#111}
</style>
</head>
<body>
<h1>Latest AI Models</h1>
<p class="meta">Source: OpenRouter API | Updated: ${esc(updated)} | ${models.length} models, last ${days} days<br>
<a href="/llms.txt">llms.txt</a> · <a href="/json">JSON</a></p>
<table>
<thead><tr><th>Model ID</th><th>Context</th><th>Output</th><th>Pricing (per 1M)</th><th>Released</th></tr></thead>
<tbody>
${rows}</tbody>
</table>
</body>
</html>`;
}

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Handler ---

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const days = Math.min(Math.max(parseInt(url.searchParams.get('days') ?? '') || DEFAULT_DAYS, 1), 365);
		const providerFilter = url.searchParams.get('provider') || undefined;

		try {
			const { models, updated } = await fetchModels(days, providerFilter);
			const headers = { 'Cache-Control': `public, max-age=${CACHE_TTL}` };
			const path = url.pathname;

			if (path === '/llms.txt') {
				return new Response(renderText(models, updated, days), {
					headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
				});
			}

			if (path === '/json') {
				return new Response(renderJSON(models, updated, days), {
					headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
				});
			}

			// Default: HTML
			return new Response(renderHTML(models, updated, days), {
				headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' },
			});
		} catch (err) {
			console.error(JSON.stringify({ event: 'fetch_error', error: String(err) }));
			return new Response('Service temporarily unavailable', { status: 502 });
		}
	},
} satisfies ExportedHandler;
