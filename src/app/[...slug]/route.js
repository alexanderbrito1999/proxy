import { handleProxy, handlePreflight } from "../../utils/proxyHandler";

export const dynamic = "force-dynamic"; // Disable static caching

export async function GET(req, { params }) {
  const data = await params;
  return handleProxy(req, { slug: data.slug });
}

export async function POST(req, { params }) {
  const data = await params;
  return handleProxy(req, { slug: data.slug });
}

export async function PUT(req, { params }) {
  const data = await params;
  return handleProxy(req, { slug: data.slug });
}

export async function DELETE(req, { params }) {
  const data = await params;
  return handleProxy(req, { slug: data.slug });
}

export async function OPTIONS(req) {
  return handlePreflight(req.headers.get("origin"));
}
