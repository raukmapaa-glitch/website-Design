"use strict";

// Small dependency-free demo server for the assignment. A real deployment would
// use a managed database, HTTPS, email delivery, payments and moderation.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFile } = require("node:child_process");
const { version: VERSION } = require("./package.json");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC = path.join(__dirname, "public");
const DATA_DIR = process.env.DOBU_DATA_DIR
  ? path.resolve(process.env.DOBU_DATA_DIR)
  : path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");
const SESSION_AGE = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_PARAMETERS = { N: 16384, r: 8, p: 5, maxmem: 64 * 1024 * 1024 };
const LEGACY_SCRYPT_PARAMETERS = { ...SCRYPT_PARAMETERS, p: 1 };
const PLANS = new Set(["basic", "intermediate", "advanced", "elite", "junior"]);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], sessions: [], posts: [], inquiries: [] }, null, 2), { mode: 0o600 });
}
let db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
let migrated = false;
for (const key of ["users", "sessions", "posts", "inquiries"]) {
  if (!Object.prototype.hasOwnProperty.call(db, key)) {
    db[key] = [];
    migrated = true;
  } else if (!Array.isArray(db[key])) {
    throw new Error(`The data store field ${key} must be an array. The original file has not been changed.`);
  }
}
if (migrated) save();
const attempts = new Map();

function save() {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, DATA_FILE);
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    ...headers
  });
  res.end(JSON.stringify(body));
}

function fail(res, status, message) { send(res, status, { error: message }); }
function clean(value, max = 200) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, plan: user.plan, joined: user.joined };
}
function hashPassword(password, salt, parameters = SCRYPT_PARAMETERS) {
  return crypto.scryptSync(password, salt, 64, parameters).toString("hex");
}
function verifyPassword(password, user) {
  const parameters = user.passwordParameters || LEGACY_SCRYPT_PARAMETERS;
  const actual = Buffer.from(hashPassword(password, user.salt, parameters), "hex");
  const expected = Buffer.from(user.passwordHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function sessionFor(req) {
  const cookie = req.headers.cookie || "";
  const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("dobu_session="))?.slice(13);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  const session = db.sessions.find(x => x.hash === digest && x.expires > Date.now());
  if (!session) return null;
  const user = db.users.find(x => x.id === session.userId);
  return user ? { user, session } : null;
}
function issueSession(res, user) {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions = db.sessions.filter(s => s.userId !== user.id && s.expires > Date.now());
  db.sessions.push({ hash: crypto.createHash("sha256").update(token).digest("hex"), userId: user.id, expires: Date.now() + SESSION_AGE });
  save();
  res.setHeader("Set-Cookie", `dobu_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_AGE / 1000}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
}
function limit(req, res, category, max = 12) {
  const key = `${req.socket.remoteAddress}:${category}`;
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < 15 * 60 * 1000);
  recent.push(now);
  attempts.set(key, recent);
  if (recent.length > max) { fail(res, 429, "Too many requests. Please try again later."); return true; }
  return false;
}
async function readJSON(req) {
  if (!(req.headers["content-type"] || "").startsWith("application/json")) throw new Error("Send JSON content.");
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 16_384) throw new Error("Request is too large.");
  }
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request.");
  return value;
}

async function api(req, res, pathname) {
  if (req.method !== "GET") {
    // Browsers send Origin on JSON POST/PUT requests; require same origin when supplied.
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin) {
      try { if (new URL(origin).host !== host) return fail(res, 403, "Request origin is not allowed."); }
      catch { return fail(res, 403, "Request origin is not allowed."); }
    }
  }
  const auth = sessionFor(req);
  if (pathname === "/api/health" && req.method === "GET") {
    return send(res, 200, { ok: true, application: "DoBu Martial Arts", version: VERSION });
  }
  if (pathname === "/api/me" && req.method === "GET") return send(res, 200, { user: auth ? publicUser(auth.user) : null });
  if (pathname === "/api/posts" && req.method === "GET") {
    const posts = db.posts.slice(-50).reverse().map(({ id, author, text, created }) => ({ id, author, text, created }));
    return send(res, 200, { posts });
  }

  if (pathname === "/api/register" && req.method === "POST") {
    if (limit(req, res, "auth", 10)) return;
    const input = await readJSON(req);
    const name = clean(input.name, 60), email = clean(input.email, 120).toLowerCase();
    const password = input.password;
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" || password.length < 10 || password.length > 128) {
      return fail(res, 400, "Enter a name, valid email and a password of at least 10 characters.");
    }
    if (db.users.some(u => u.email === email)) return fail(res, 409, "This email already has an account.");
    const salt = crypto.randomBytes(16).toString("hex");
    const user = { id: crypto.randomUUID(), name, email, salt, passwordHash: hashPassword(password, salt), passwordParameters: { ...SCRYPT_PARAMETERS }, plan: null, joined: new Date().toISOString() };
    db.users.push(user);
    issueSession(res, user);
    return send(res, 201, { user: publicUser(user) });
  }
  if (pathname === "/api/login" && req.method === "POST") {
    if (limit(req, res, "auth", 10)) return;
    const input = await readJSON(req);
    const email = clean(input.email, 120).toLowerCase();
    const user = db.users.find(u => u.email === email);
    if (!user || typeof input.password !== "string" || !verifyPassword(input.password, user)) return fail(res, 401, "Incorrect email or password.");
    if (!user.passwordParameters) {
      user.passwordHash = hashPassword(input.password, user.salt);
      user.passwordParameters = { ...SCRYPT_PARAMETERS };
    }
    issueSession(res, user);
    return send(res, 200, { user: publicUser(user) });
  }
  if (pathname === "/api/logout" && req.method === "POST") {
    if (auth) { db.sessions = db.sessions.filter(s => s !== auth.session); save(); }
    res.setHeader("Set-Cookie", "dobu_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    return send(res, 200, { ok: true });
  }
  if (pathname === "/api/membership" && req.method === "PUT") {
    if (!auth) return fail(res, 401, "Please sign in first.");
    const input = await readJSON(req);
    if (input.plan !== null && !PLANS.has(input.plan)) return fail(res, 400, "Select a valid plan.");
    auth.user.plan = input.plan;
    save();
    return send(res, 200, { user: publicUser(auth.user) });
  }
  if (pathname === "/api/posts" && req.method === "POST") {
    if (!auth) return fail(res, 401, "Please sign in to post.");
    if (limit(req, res, "post", 6)) return;
    const input = await readJSON(req);
    const text = clean(input.text, 500);
    if (text.length < 4) return fail(res, 400, "Write at least four characters.");
    const post = { id: crypto.randomUUID(), author: auth.user.name, text, created: new Date().toISOString() };
    db.posts.push(post);
    save();
    return send(res, 201, { post });
  }
  if (pathname === "/api/contact" && req.method === "POST") {
    if (limit(req, res, "contact", 5)) return;
    const input = await readJSON(req);
    const name = clean(input.name, 60), email = clean(input.email, 120), message = clean(input.message, 1500);
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return fail(res, 400, "Complete your name, email and message.");
    db.inquiries.push({ id: crypto.randomUUID(), name, email, message, created: new Date().toISOString() });
    save();
    return send(res, 201, { ok: true, message: "Your message has been saved in this demo." });
  }
  return fail(res, 404, "Not found.");
}

function staticFile(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") return fail(res, 405, "Method not allowed.");
  const requested = pathname === "/" ? "/index.html" : pathname;
  const file = path.resolve(PUBLIC, "." + requested);
  if (!file.startsWith(PUBLIC + path.sep)) return fail(res, 403, "Forbidden.");
  let stat;
  try { stat = fs.statSync(file); } catch { return fail(res, 404, "Page not found."); }
  if (!stat.isFile() || !MIME[path.extname(file)]) return fail(res, 404, "Page not found.");
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(file)],
    "Cache-Control": path.extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname); }
  catch { return fail(res, 400, "Invalid URL."); }
  if (pathname.startsWith("/api/")) {
    api(req, res, pathname).catch(error => {
      if (error instanceof SyntaxError || /Request is too large|Invalid request|Send JSON content/.test(error.message)) return fail(res, 400, "Invalid request data.");
      console.error(error);
      fail(res, 500, "Something went wrong.");
    });
  } else staticFile(req, res, pathname);
});
server.on("error", error => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Close the earlier website server, or choose another PORT.`);
  } else {
    console.error(error.message);
  }
  process.exitCode = 1;
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`DoBu Martial Arts: ${url}`);
  console.log(`Version ${VERSION}. Keep this terminal open while using the website.`);
  if (!process.argv.includes("--open")) return;
  const page = `${url}/membership.html`;
  const command = process.platform === "win32" ? "rundll32.exe"
    : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["url.dll,FileProtocolHandler", page] : [page];
  execFile(command, args, error => {
    if (error) console.log(`Open ${page} in your browser.`);
  });
});
