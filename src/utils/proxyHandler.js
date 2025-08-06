export async function handleProxy(req, { slug = [] }) {
  const origin = req.headers.get("origin");
  const method = req.method.toUpperCase();

  // Handle OPTIONS preflight requests
  if (method === "OPTIONS") {
    return handlePreflight(origin);
  }

  // Verify origin
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Construct backend URL
  const url = new URL(req.url);
  const path = slug.length ? `/${slug.join("/")}` : "";
  const backendUrl = `${process.env.BACKEND_URL}${path}${url.search}`;

  try {
    const proxyResponse = await fetch(backendUrl, {
      method,
      headers: createProxyHeaders(req.headers),
      //       body: method !== "GET" && method !== "HEAD" ? await req.text() : null,
      body: method !== "GET" && method !== "HEAD" ? req.body : undefined,
      duplex: method !== "GET" && method !== "HEAD" ? "half" : undefined,
    });

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      headers: createResponseHeaders(proxyResponse.headers, origin),
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({ error: "Backend connection failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// utils/corsUtils.ts
const STATIC_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];
const LOCAL_ALLOWED_HOSTNAMES = ["localhost", "wails.localhost", "192.168.0.148"];

export function isAllowedOrigin(origin) {
  if (!origin) return false;

  try {
    const url = new URL(origin);
    return LOCAL_ALLOWED_HOSTNAMES.includes(url.hostname) || STATIC_ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

export function handlePreflight(origin) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  });

  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  return new Response(null, { status: 204, headers });
}

export function createProxyHeaders(originalHeaders) {
  const headers = new Headers();

  // Forward selected headers
  const forwardHeaders = ["authorization", "content-type", "accept", "user-agent", "x-requested-with"];

  originalHeaders.forEach((value, key) => {
    if (forwardHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

export function createResponseHeaders(backendHeaders, origin) {
  const headers = new Headers();

  // Copy backend headers except security-related ones
  backendHeaders.forEach((value, key) => {
    if (!key.toLowerCase().startsWith("access-control-") && key.toLowerCase() !== "set-cookie") {
      headers.set(key, value);
    }
  });

  // Add CORS headers if origin is valid
  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");

  // Uncomment and customize if you need caching
  // if (req.method === 'GET') {
  //   headers.set('Cache-Control', 'public, max-age=300');
  // }

  return headers;
}
