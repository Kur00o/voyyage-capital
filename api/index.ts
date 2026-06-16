import type { IncomingMessage, ServerResponse } from "node:http";

// Built by `npm run build` (vite build) before @vercel/node compiles this file.
// ncc bundles dist/server/index.js + all its node_modules deps into the function.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import _server from "../dist/server/server.js";

const server = _server as {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
};

export const config = { maxDuration: 30 };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host =
    (req.headers["x-forwarded-host"] as string | undefined) ??
    req.headers.host ??
    "localhost";
  const url = new URL(req.url ?? "/", `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  let body: Uint8Array | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  const request = new Request(url.toString(), {
    method: req.method ?? "GET",
    headers,
    body: body ?? null,
  });

  const response = await server.fetch(request, {}, {});

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.end(Buffer.from(await response.arrayBuffer()));
}
