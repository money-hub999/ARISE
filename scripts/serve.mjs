import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};
const publicFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/style.css", "style.css"],
  ["/app.js", "app.js"],
  ["/favicon.svg", "favicon.svg"],
  ["/src/app.js", "src/app.js"],
  ["/src/domain.js", "src/domain.js"],
  ["/src/storage.js", "src/storage.js"]
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const publicPath = publicFiles.get(pathname);
    if (!publicPath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const filePath = resolve(projectRoot, publicPath);
    const fileDetails = await stat(filePath);
    if (!fileDetails.isFile()) throw new Error("Not a file");
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
  }
});

const port = Number(process.env.PORT) || 4173;
const host = process.argv.includes("--lan") ? "0.0.0.0" : "127.0.0.1";
server.listen(port, host, () => {
  console.log(`ARISE SYSTEM V10 available at http://127.0.0.1:${port}${host === "0.0.0.0" ? " (LAN access enabled on this port)" : ""}`);
});
