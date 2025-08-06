import { handleProxy } from "../../utils/proxyHandler";

export const dynamic = "force-dynamic"; // Disable static caching

export async function GET(req, { params }) {
  return handleProxy(req, { slug: params.slug });
}

export async function POST(req, { params }) {
  return handleProxy(req, { slug: params.slug });
}

export async function PUT(req, { params }) {
  return handleProxy(req, { slug: params.slug });
}

export async function DELETE(req, { params }) {
  return handleProxy(req, { slug: params.slug });
}

export async function OPTIONS(req) {
  return handlePreflight(req.headers.get("origin"));
}
