/*
 * ARTIC GYM · Servidor del sitio
 * --------------------------------
 * Sirve la página y guarda los cambios del Panel de Administración
 * (productos, café, membresías, fotos) para que todos los visitantes los vean.
 *
 * Sin dependencias: solo requiere Node.js 18 o superior.
 *
 *   ADMIN_USER=tu-usuario ADMIN_PASSWORD=tu-contraseña node server.js
 *
 * Variables de entorno:
 *   PORT            Puerto (por defecto 3000)
 *   ADMIN_USER      Usuario del panel (por defecto el de prueba)
 *   ADMIN_PASSWORD  Contraseña del panel (obligatorio en producción)
 *   DATA_DIR        Carpeta donde se guardan datos y fotos (por defecto ./storage)
 */
"use strict";

const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "storage"));
const DATA_FILE = path.join(DATA_DIR, "data.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const USER = process.env.ADMIN_USER || "Mayin26";
const PASSWORD = process.env.ADMIN_PASSWORD || "mayin7759";
const TOKEN_TTL = 12 * 60 * 60 * 1000;
const MAX_JSON = 2 * 1024 * 1024;
const MAX_UPLOAD = 8 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

if (!process.env.ADMIN_PASSWORD) {
  console.warn("⚠  ADMIN_PASSWORD no está definida; usando el acceso de prueba.");
}
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};
// Solo estas carpetas del proyecto son públicas.
const PUBLIC_DIRS = new Set(["css", "js", "assets"]);

/* ---------- Sesiones ---------- */
const tokens = new Map();
const attempts = new Map();

function sha(s) { return crypto.createHash("sha256").update(String(s)).digest(); }
function credentialsOk(user, pass) {
  const userOk = crypto.timingSafeEqual(sha(String(user).trim().toLowerCase()), sha(USER.toLowerCase()));
  const passOk = crypto.timingSafeEqual(sha(pass), sha(PASSWORD));
  return userOk && passOk;
}

function issueToken() {
  const t = crypto.randomBytes(32).toString("hex");
  tokens.set(t, Date.now() + TOKEN_TTL);
  return t;
}
function authed(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || "");
  if (!m) return false;
  const exp = tokens.get(m[1]);
  if (!exp || exp < Date.now()) { tokens.delete(m[1]); return false; }
  return true;
}
function tooManyAttempts(ip) {
  const now = Date.now();
  const rec = attempts.get(ip) || { n: 0, reset: now + 15 * 60 * 1000 };
  if (rec.reset < now) { rec.n = 0; rec.reset = now + 15 * 60 * 1000; }
  attempts.set(ip, rec);
  return rec.n >= 10;
}

/* ---------- Utilidades HTTP ---------- */
function send(res, status, body, headers = {}) {
  res.writeHead(status, Object.assign({ "X-Content-Type-Options": "nosniff" }, headers));
  res.end(body);
}
function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error("El archivo es demasiado grande."), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); }
      catch (e) { reject(Object.assign(new Error("JSON inválido."), { status: 400 })); }
    });
    req.on("error", reject);
  });
}

/* ---------- Datos ---------- */
async function readData() {
  try { return JSON.parse(await fsp.readFile(DATA_FILE, "utf8")); }
  catch (e) { return null; }
}
async function writeData(data) {
  const tmp = DATA_FILE + "." + process.pid + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
  try { await fsp.copyFile(DATA_FILE, path.join(DATA_DIR, "data.backup.json")); } catch (e) { /* primera vez */ }
  await fsp.rename(tmp, DATA_FILE);
}
function validData(d) {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  if (!d.settings || typeof d.settings !== "object") return false;
  return ["facilities", "cafe", "plans", "products"].every((k) => Array.isArray(d[k]));
}

/* ---------- API ---------- */
async function api(req, res, pathname) {
  const ip = req.socket.remoteAddress || "?";

  if (pathname === "/api/data" && req.method === "GET") {
    return json(res, 200, { ok: true, data: await readData() });
  }

  if (pathname === "/api/login" && req.method === "POST") {
    if (tooManyAttempts(ip)) return json(res, 429, { error: "Demasiados intentos. Espera 15 minutos." });
    const body = await readBody(req, 10 * 1024);
    if (typeof body.username !== "string" || typeof body.password !== "string" || !credentialsOk(body.username, body.password)) {
      attempts.get(ip).n++;
      return json(res, 401, { error: "Usuario o contraseña incorrectos." });
    }
    attempts.delete(ip);
    return json(res, 200, { token: issueToken() });
  }

  if (pathname === "/api/data" && req.method === "PUT") {
    if (!authed(req)) return json(res, 401, { error: "Sesión expirada." });
    const body = await readBody(req, MAX_JSON);
    if (!validData(body.data)) return json(res, 400, { error: "Datos con formato incorrecto." });
    await writeData(body.data);
    return json(res, 200, { ok: true });
  }

  if (pathname === "/api/upload" && req.method === "POST") {
    if (!authed(req)) return json(res, 401, { error: "Sesión expirada." });
    const body = await readBody(req, MAX_UPLOAD);
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ""));
    if (!m) return json(res, 400, { error: "Formato de imagen no permitido." });
    const buf = Buffer.from(m[2], "base64");
    if (buf.length > MAX_IMAGE_BYTES) return json(res, 413, { error: "La imagen es demasiado grande." });
    const name = Date.now().toString(36) + "-" + crypto.randomBytes(6).toString("hex") + "." + (m[1] === "jpeg" ? "jpg" : m[1]);
    await fsp.writeFile(path.join(UPLOAD_DIR, name), buf);
    return json(res, 200, { url: "uploads/" + name });
  }

  return json(res, 404, { error: "No encontrado." });
}

/* ---------- Archivos estáticos ---------- */
async function serveFile(res, file, cache) {
  try {
    const stat = await fsp.stat(file);
    if (!stat.isFile()) throw new Error("no es archivo");
    send(res, 200, await fsp.readFile(file), {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": cache
    });
  } catch (e) {
    send(res, 404, "No encontrado", { "Content-Type": "text/plain; charset=utf-8" });
  }
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (e) { return send(res, 400, "Solicitud inválida"); }

  if (pathname.startsWith("/api/")) return api(req, res, pathname);
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Método no permitido");

  if (pathname === "/" || pathname === "/index.html") {
    return serveFile(res, path.join(ROOT, "index.html"), "no-cache");
  }
  const parts = pathname.split("/").filter(Boolean);
  if (parts.some((p) => p === ".." || p.startsWith("."))) return send(res, 404, "No encontrado");

  if (parts[0] === "uploads" && parts.length === 2) {
    return serveFile(res, path.join(UPLOAD_DIR, parts[1]), "public, max-age=31536000, immutable");
  }
  if (PUBLIC_DIRS.has(parts[0])) {
    return serveFile(res, path.join(ROOT, ...parts), "public, max-age=3600");
  }
  return send(res, 404, "No encontrado", { "Content-Type": "text/plain; charset=utf-8" });
}

http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    if (!res.headersSent) json(res, err.status || 500, { error: err.status ? err.message : "Error del servidor." });
    if (!err.status) console.error(err);
  });
}).listen(PORT, () => {
  console.log(`ARTIC GYM listo en http://localhost:${PORT}`);
  console.log(`Datos y fotos en: ${DATA_DIR}`);
});
