/**
 * gen-latest-yml.cjs
 * Generates latest.yml update manifest for electron-updater.
 *
 * Since dist:win uses --publish never, electron-builder does NOT
 * generate this file. We compute it manually after the build.
 *
 * Usage: node scripts/gen-latest-yml.cjs
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const releaseDir = path.join(__dirname, "..", "release");
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"));
const version = pkg.version;

const exeFiles = fs.readdirSync(releaseDir).filter((f) => f.endsWith(".exe") && f.includes("Setup"));
if (exeFiles.length === 0) {
  console.error("No .exe installer found in release/");
  process.exit(1);
}
const exeFile = exeFiles[0];
const exePath = path.join(releaseDir, exeFile);

const fileBuffer = fs.readFileSync(exePath);
const sha512 = crypto.createHash("sha512").update(fileBuffer).digest("base64");
const size = fileBuffer.length;

const url = `Void Notes Setup ${version}.exe`;
const releaseDate = new Date().toISOString();

const yml = [
  `version: ${version}`,
  `files:`,
  `  - url: ${exeFile}`,
  `    sha512: ${sha512}`,
  `    size: ${size}`,
  `path: ${exeFile}`,
  `sha512: ${sha512}`,
  `releaseDate: ${releaseDate}`,
  "",
].join("\n");

const outPath = path.join(releaseDir, "latest.yml");
fs.writeFileSync(outPath, yml, "utf-8");
console.log(`Wrote ${outPath} (version=${version}, sha512=${sha512.slice(0, 12)}..., size=${size})`);
