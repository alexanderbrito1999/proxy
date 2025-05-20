// import { createGzip } from "zlib";
export async function GET(req, { params }) {
  const data = await params;
  return handleProxy(req, data);
}

export async function PUT(req, { params }) {
  const data = await params;
  return handleProxy(req, data);
}
const STATIC_ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    // Dominios locales sin importar puerto
    const allowedHostnames = ["localhost", "wails.localhost", "192.168.0.148"];

    // Permitir si el hostname está en lista local (sin importar puerto)
    if (allowedHostnames.includes(hostname)) {
      return true;
    }

    // Permitir si está exactamente en la lista de dominios estáticos
    return STATIC_ALLOWED_ORIGINS.includes(origin);
  } catch {
    return false;
  }
}

// const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS.split(",");
async function handleProxy(req, { slug = [] }) {
  // !Verificar origen
  const origin = req.headers.get("origin");

  //   if (origin && !ALLOWED_ORIGINS.includes(origin)) {
  //     return new Response(JSON.stringify({ error: "Origin not allowed" }), {
  //       status: 403,
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   }

  if (origin && !isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Construir la ruta del backend
  const path = slug.length ? `/${slug.join("/")}` : "";

  // Obtener los parámetros de la consulta de la URL original
  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryParams = url.search; // Obtiene los parámetros de consulta (todo después del ?)

  // Construir la URL completa con los parámetros de consulta
  const fullUrl = `${process.env.BACKEND_URL}${path}${queryParams}`;

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...req.headers,
      },
      body: req.method !== "GET" ? JSON.stringify(await req.json()) : null,
    });

    const responseText = await response.text();

    // Configurar cabeceras de caché
    const cacheControl =
      req.method === "GET"
        ? path.includes("title")
          ? "public, max-age=300, s-maxage=300, stale-while-revalidate=60"
          : "public, max-age=1800, s-maxage=1800, stale-while-revalidate=120"
        : "no-cache, no-store";

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...response.headers,
        "Cache-Control": cacheControl, // Cabecera de caché
        "Vercel-CDN-Cache-Control": cacheControl, // Específico para Vercel
        "Vercel-Cache-Control": cacheControl, // Específico para Vercel
      },
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Error al conectar con el backend" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
