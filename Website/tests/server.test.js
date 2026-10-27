"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const net = require("node:net");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { once } = require("node:events");

const root = path.resolve(__dirname, "..");
let child, dataDir, base, cookie = "", port;
const credentials = { name: "DoBu Test User", email: "dobu-test@example.com", password: "DoBuTest123!" };

async function start() {
  child = spawn(process.execPath, [path.join(root, "server.js")], {
    env: { ...process.env, PORT: String(port), NODE_ENV: "test", DOBU_DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "pipe"]
  });
  await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(([code]) => { throw new Error(`Server exited with ${code}`); })
  ]);
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, "exit"); child.kill(); await exited;
}
async function request(url, method = "GET", body, signedIn = true) {
  const res = await fetch(base + url, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(signedIn && cookie ? { Cookie: cookie } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const issued = res.headers.get("set-cookie");
  if (issued) cookie = issued.split(";")[0];
  return { status: res.status, body: await res.json(), headers: res.headers };
}
function database() { return JSON.parse(fs.readFileSync(path.join(dataDir, "db.json"), "utf8")); }

before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "dobu-test-"));
  const probe = net.createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`; await start();
});
after(async () => { await stop(); fs.rmSync(dataDir, { recursive: true, force: true }); });

test("all ten pages and all 100 primary navigation targets load", async () => {
  const pages = fs.readdirSync(path.join(root, "public")).filter(f => f.endsWith(".html"));
  assert.equal(pages.length, 10);
  let links = 0;
  for (const page of pages) {
    const res = await fetch(base + "/" + page); assert.equal(res.status, 200);
    const markup = await res.text();
    const nav = markup.match(/<nav[^>]*id="main-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
    const targets = [...nav.matchAll(/href="([^"]+)"/g)].map(x => x[1]);
    assert.equal(targets.length, 10, page);
    for (const target of targets) { assert.equal((await fetch(base + target)).status, 200, `${page}: ${target}`); links++; }
  }
  assert.equal(links, 100);
});

test("release identity, local assets and API cache handling", async () => {
  const health = await request("/api/health");
  assert.equal(health.body.version, "1.2.1"); assert.equal(health.headers.get("cache-control"), "no-store");
  const assets = fs.readdirSync(path.join(root, "public/assets"));
  assert.equal(assets.filter(f => f.endsWith(".webp")).length, 5);
  for (const asset of assets) {
    const res = await fetch(base + "/assets/" + asset); assert.equal(res.status, 200);
    if (asset.endsWith(".webp")) assert.equal(res.headers.get("content-type"), "image/webp");
  }
  for (const url of ["/css/styles.css?v=1.2.1", "/js/app.js?v=1.2.1"]) assert.equal((await fetch(base + url)).status, 200);
});

test("anonymous writes and invalid registration are rejected", async () => {
  assert.equal((await request("/api/membership", "PUT", { plan: "basic" }, false)).status, 401);
  assert.equal((await request("/api/posts", "POST", { text: "A test post" }, false)).status, 401);
  assert.equal((await request("/api/register", "POST", { ...credentials, password: "short" })).status, 400);
  assert.equal(database().users.length, 0);
});

test("registration creates one hashed account and rejects duplicates and bad credentials", async () => {
  const registered = await request("/api/register", "POST", credentials);
  assert.equal(registered.status, 201); assert.equal(registered.body.user.name, credentials.name);
  assert.equal(registered.body.user.plan, null);
  assert.ok(cookie.startsWith("dobu_session="));
  assert.match(registered.headers.get("set-cookie"), /HttpOnly.*SameSite=Lax/);
  const stored = database(); assert.equal(stored.users.length, 1);
  assert.equal(stored.users[0].password, undefined); assert.notEqual(stored.users[0].passwordHash, credentials.password);
  assert.equal(stored.users[0].passwordParameters.p, 5);
  assert.equal(registered.body.user.passwordHash, undefined);
  assert.equal((await request("/api/register", "POST", credentials)).status, 409);
  assert.equal((await request("/api/login", "POST", { ...credentials, password: "WrongPassword123" })).status, 401);
  assert.equal(database().users.length, 1);
});

test("five plans can be saved and changed while invalid plans preserve the previous choice", async () => {
  for (const plan of ["basic", "intermediate", "advanced", "elite", "junior"]) {
    assert.equal((await request("/api/membership", "PUT", { plan })).body.user.plan, plan);
    assert.equal((await request("/api/me")).body.user.plan, plan);
  }
  assert.equal((await request("/api/membership", "PUT", { plan: "invalid" })).status, 400);
  assert.equal((await request("/api/me")).body.user.plan, "junior");
  assert.equal((await request("/api/membership", "PUT", { plan: null })).body.user.plan, null);
  assert.equal(database().users[0].plan, null);
  await request("/api/membership", "PUT", { plan: "elite" });
});

test("sign out, sign in and server restart retain the saved preference", async () => {
  await request("/api/logout", "POST", {});
  assert.equal((await request("/api/me")).body.user, null);
  assert.equal((await request("/api/login", "POST", credentials)).status, 200);
  assert.equal((await request("/api/me")).body.user.plan, "elite");
  await stop(); await start();
  assert.equal((await request("/api/me")).body.user.plan, "elite");
});

test("contact validation rejects invalid input and stores one valid enquiry", async () => {
  const valid = { name: "Enquiry Test", email: "enquiry@example.com", message: "Please tell me about the beginner classes." };
  assert.equal((await request("/api/contact", "POST", { ...valid, email: "abc" })).status, 400);
  assert.equal(database().inquiries.length, 0);
  const submitted = await request("/api/contact", "POST", valid);
  assert.equal(submitted.status, 201); assert.match(submitted.body.message, /saved in this demo/);
  assert.equal(database().inquiries.length, 1);
});

test("community loads its empty state data and retains an authenticated post", async () => {
  assert.deepEqual((await request("/api/posts")).body.posts, []);
  assert.equal((await request("/api/posts", "POST", { text: "abc" })).status, 400);
  const result = await request("/api/posts", "POST", { text: "This is a fictional DoBu test discussion." });
  assert.equal(result.status, 201);
  const loaded = (await request("/api/posts")).body.posts;
  assert.equal(loaded.length, 1); assert.equal(loaded[0].author, credentials.name);
  assert.equal(loaded[0].id, result.body.post.id); assert.equal(database().posts.length, 1);
});

test("missing resources, malformed input and foreign origins are rejected", async () => {
  assert.equal((await fetch(base + "/missing.html")).status, 404);
  assert.equal((await fetch(base + "/server.js")).status, 404);
  assert.equal((await fetch(base + "/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })).status, 400);
  assert.equal((await fetch(base + "/api/contact", { method: "POST", headers: { "Content-Type": "application/json", Origin: "https://example.com" }, body: "{}" })).status, 403);
});

test("existing demo accounts can sign in and their legacy password hash is upgraded", async () => {
  await stop();
  const db = database(); const salt = crypto.randomBytes(16).toString("hex");
  db.users.push({ id: "legacy-member", name: "Legacy Member", email: "legacy@example.com", salt,
    passwordHash: crypto.scryptSync("LegacyTest123!", salt, 64).toString("hex"), plan: "basic", joined: new Date().toISOString() });
  fs.writeFileSync(path.join(dataDir, "db.json"), JSON.stringify(db));
  await start();
  const loggedIn = await request("/api/login", "POST", { email: "legacy@example.com", password: "LegacyTest123!" });
  assert.equal(loggedIn.status, 200); assert.equal(loggedIn.body.user.plan, "basic");
  assert.equal(database().users.find(u => u.id === "legacy-member").passwordParameters.p, 5);
});

test("an older database without posts is upgraded while accounts, sessions and enquiries are preserved", async () => {
  await stop();
  const legacy = database();
  delete legacy.posts;
  fs.writeFileSync(path.join(dataDir, "db.json"), JSON.stringify(legacy));
  await start();
  const posts = await request("/api/posts");
  assert.equal(posts.status, 200);
  assert.deepEqual(posts.body.posts, []);
  const upgraded = database();
  assert.deepEqual(upgraded.users, legacy.users);
  assert.deepEqual(upgraded.sessions, legacy.sessions);
  assert.deepEqual(upgraded.inquiries, legacy.inquiries);
  assert.deepEqual(upgraded.posts, []);
  assert.equal((await request("/api/me")).body.user.email, "legacy@example.com");
});
