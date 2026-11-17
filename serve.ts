// serve.ts — tiny static server for local testing and screenshots.
// Serves app/ at its root on http://localhost:8080 (or --port <n>).
// Node 22, standard library only. Run from the entry directory:
//   node serve.ts            (port 8080)
//   node serve.ts --port 9000

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = resolve(join(fileURLToPath(new URL(".", import.meta.url)), "app"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const args = process.argv.slice(2);
const portFlag = args.indexOf("--port");
const port = portFlag >= 0 ? Number(args[portFlag + 1]) || 8080 : 8080;

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/favicon.ico") {
    // No favicon file: answer 204 so browsers do not log a 404.
    res.writeHead(204);
    res.end();
    return;
  }
  let path = decodeURIComponent(url.pathname);
  if (path === "/") path = "/index.html";
  const file = join(appDir, path);
  if (!file.startsWith(appDir) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
});

server.listen(port, () => {
  console.log(`Serving app/ at http://localhost:${port}`);
});
