const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.env.PORT || 3000);
const host = "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${host}:${port}`);
  } catch {
    send(res, 400, "Bad request");
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/" || pathname === "") pathname = "/index.html";

  const file = path.normalize(path.join(root, pathname));
  if (!file.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      send(res, 404, "Not found");
      return;
    }

    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log(`Static server running at http://${host}:${port}/`);
});
