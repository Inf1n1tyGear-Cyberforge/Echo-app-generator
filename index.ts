import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: 'OpenRouter API key not configured on server', code: 500 } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/openrouter-proxy/, '');
    const targetPath = path || '/chat/completions';
    const targetUrl = `${OPENROUTER_BASE}${targetPath}`;

    // Forward the request body for POST, or query params for GET
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // Add referer/title headers that OpenRouter expects
    headers['HTTP-Referer'] = Deno.env.get('SITE_URL') || 'https://echo.app';
    headers['X-Title'] = 'Echo - App Generator';

    let response: Response;
    if (req.method === 'GET') {
      response = await fetch(targetUrl, { method: 'GET', headers });
    } else {
      const body = await req.text();
      response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body,
      });
    }

    // Read the response body
    const responseBody = await response.text();

    // Return the proxied response
    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[openrouter-proxy] Error:', err);
    return new Response(
      JSON.stringify({ error: { message: 'Internal server error', code: 500 } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});