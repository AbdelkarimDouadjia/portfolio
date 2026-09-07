const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const files = [
  "index.html", "projects.html", "project-detail.html", "asset-manifest.json",
  "sw.js", "CNAME", "assets",
  "ChatGPT Image Apr 28, 2026, 07_01_21 PM.png",
  "ChatGPT Image Apr 28, 2026, 07_01_32 PM.png",
  "node_modules/three/build/three.module.min.js", "node_modules/three/LICENSE",
  "node_modules/gsap/index.js", "node_modules/gsap/gsap-core.js", "node_modules/gsap/CSSPlugin.js",
  "node_modules/gsap/package.json", "node_modules/@studio-freight/lenis/dist/lenis.mjs",
  "node_modules/@studio-freight/lenis/package.json"
];

for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing release input: ${file}`);
}
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) {
  throw new Error("Refusing to replace a linked dist directory");
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of files) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(path.join(root, file), destination, { recursive: true });
}

// Pages must serve the local ES modules, including the node_modules path.
fs.writeFileSync(path.join(output, ".nojekyll"), "");
const release = crypto.createHash("sha256");
for (const file of fs.readdirSync(output, { recursive: true }).sort()) {
  const fullPath = path.join(output, file);
  if (!fs.statSync(fullPath).isFile()) continue;
  release.update(file.replaceAll(path.sep, "/"));
  release.update(fs.readFileSync(fullPath));
}
const id = release.digest("hex").slice(0, 16);
fs.writeFileSync(path.join(output, "release.json"), JSON.stringify({ id, commit: process.env.GITHUB_SHA || null }) + "\n");
console.log(`Built portfolio release ${id} in ${output}`);
