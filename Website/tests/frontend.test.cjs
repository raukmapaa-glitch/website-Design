const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const project = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(project, 'public/js/app.js'), 'utf8');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/membership-dom.json'), 'utf8'));
let checks = 0;
function pass(name) { checks++; console.log(`PASS: ${name}`); }
function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function settle(predicate) {
  for (let n = 0; n < 1000; n++) {
    if (predicate()) return;
    await new Promise(resolve => setImmediate(resolve));
  }
  throw new Error('Expected UI state was not reached');
}
class Element {
  constructor(item) {
    this.tagName = item.tag;
    this.attrs = { ...item.attrs };
    this.parentIds = item.parent_ids;
    this.dataset = {};
    for (const [key,value] of Object.entries(this.attrs)) if (key.startsWith('data-')) this.dataset[key.slice(5)] = value;
    this.children = [];
    this.focus = () => { this.focused = true; };
    this.reset = () => {};
    this.append = (...nodes) => this.children.push(...nodes);
    this.replaceChildren = (...nodes) => { this.textContent = ''; this.children = [...nodes]; };
    this.textContent = item.text;
    this.hidden = Object.hasOwn(this.attrs, 'hidden');
    this.disabled = false;
    this.value = this.attrs.value || '';
    this.href = this.attrs.href || '';
    this.events = {};
    const classes = new Set((this.attrs.class || '').split(/\s+/));
    this.classList = {
      toggle: (name, force) => {
        const on = force === undefined ? !classes.has(name) : force;
        if (on) classes.add(name); else classes.delete(name);
        return on;
      },
      contains: name => classes.has(name),
      add: name => classes.add(name),
      remove: name => classes.delete(name)
    };
  }
  addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
  async fire(name, extra = {}) {
    for (const fn of this.events[name] || []) await fn({ preventDefault() {}, ...extra });
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  removeAttribute(name) { delete this.attrs[name]; }
}
function page(fetcher, search = '', fastTimeout = false, which = 'membership', port = '3000') {
  const actualFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/' + which + '-dom.json'), 'utf8'));
  const elements = actualFixture.map(item => new Element(item));
  function matches(el, selector) {
    if (selector.startsWith('#')) return el.attrs.id === selector.slice(1);
    if (selector.startsWith('.')) return (el.attrs.class || '').split(/\s+/).includes(selector.slice(1));
    if (selector === '[data-tab]') return Object.hasOwn(el.attrs, 'data-tab');
    if (selector === '[data-account-link]') return Object.hasOwn(el.attrs, 'data-account-link');
    if (selector === 'button[type="submit"]') return el.tagName === 'button' && el.attrs.type === 'submit';
    return false;
  }
  for (const el of elements) {
    el.querySelector = selector => elements.find(child => child.parentIds.includes(el.attrs.id) && matches(child, selector)) || null;
  }
  const events = {};
  const document = {
    body: { dataset: { page: which }, prepended: [], prepend(el) { this.prepended.push(el); } },
    createElement: tag => new Element({ tag, attrs: {}, text: '', parent_ids: [] }),
    querySelector: selector => elements.find(el => matches(el, selector)) || null,
    querySelectorAll: selector => elements.filter(el => matches(el, selector)),
    addEventListener: (name, fn) => { events[name] = fn; }
  };
  const location = { search, href: '/' + which + '.html' + search, hostname: 'localhost', port, pathname: '/' + which + '.html', hash: '' };
  const requests = [];
  const context = vm.createContext({
    document, location, URLSearchParams, AbortController, console,
    FormData: class { constructor(form) { this.items = elements.filter(el => el.parentIds.includes(form.attrs.id) && el.attrs.name && !el.disabled).map(el => [el.attrs.name, el.value]); } [Symbol.iterator]() { return this.items[Symbol.iterator](); } },
    history: { replaceState(_a, _b, url) { location.href = url; location.search = new URL(url, 'http://local').search; } },
    setTimeout: (fn, ms) => setTimeout(fn, fastTimeout && ms === 10000 ? 1 : ms),
    clearTimeout,
    fetch: async (url, options) => { requests.push({ url, options }); return fetcher(url, options); },
    alert: msg => { throw new Error('Unexpected alert: ' + msg); }
  });
  vm.runInContext(app, context);
  events.DOMContentLoaded();
  const get = selector => document.querySelector(selector);
  return { get, document, location, context, requests, run: code => vm.runInContext(code, context) };
}
const member = { id: 'member-1', name: 'Membership Test', email: 'member@example.com', plan: 'basic' };

async function uiChecks() {
  for (const plan of ['basic', 'intermediate', 'advanced', 'elite', 'junior']) {
    const guest = page(async () => response({ user: null }), `?plan=${plan}`);
    await settle(() => guest.get('#membership-status').hidden);
    assert.equal(guest.get('#membership-guest').hidden, false);
    assert.equal(guest.get('#membership-account').hidden, true);
    assert.equal(guest.get('#membership-register-link').href, `/login.html?tab=register&plan=${plan}`);
    assert.equal(guest.get('#membership-login-link').href, `/login.html?plan=${plan}`);
    guest.run('redirectAfterAuth()');
    assert.equal(guest.location.href, `/membership.html?plan=${plan}`);
  }
  pass('all five pricing choices survive guest sign-in/registration links and auth redirects');

  const loading = deferred();
  const pending = page(() => loading.promise);
  assert.equal(pending.get('#membership-guest').hidden, true);
  assert.equal(pending.get('#membership-account').hidden, true);
  assert.equal(pending.get('#membership-status').hidden, false);
  loading.resolve(response({ user: member }));
  await settle(() => pending.get('#membership-status').hidden);
  assert.equal(pending.get('#membership-account').hidden, false);
  pass('account check displays loading instead of briefly showing a signed-out page');

  let saved = { ...member };
  const p = page(async (url, options) => {
    if (url === '/api/membership') saved = { ...saved, plan: JSON.parse(options.body).plan };
    return response({ user: { ...saved } });
  }, '?plan=advanced');
  await settle(() => p.get('#membership-status').hidden);
  assert.equal(p.get('#current-plan').textContent, 'Basic');
  assert.equal(p.get('#member-plan').value, 'advanced');
  await p.get('#membership-form').fire('submit');
  assert.equal(p.get('#current-plan').textContent, 'Advanced');
  assert.equal(p.location.href, '/membership.html');
  assert.equal(p.get('#membership-form').querySelector('.form-message').classList.contains('success'), true);
  const refreshed = page(async () => response({ user: saved }));
  await settle(() => refreshed.get('#membership-status').hidden);
  assert.equal(refreshed.get('#member-plan').value, 'advanced');
  pass('authenticated plan handoff, successful save, query cleanup and refreshed display');

  p.get('#member-plan').value = '';
  await p.get('#membership-form').fire('submit');
  assert.equal(saved.plan, null);
  assert.equal(p.get('#current-plan').textContent, 'No plan selected');
  pass('No plan selected sends null and clears the displayed preference');

  let online = false;
  const retry = page(async () => {
    if (!online) throw new TypeError('Network unavailable');
    return response({ user: member });
  });
  await settle(() => !retry.get('#membership-retry').hidden);
  assert.equal(retry.get('#membership-guest').hidden, true);
  assert.equal(retry.get('#membership-account').hidden, true);
  assert.match(retry.get('#membership-status-message').textContent, /Cannot connect/);
  online = true;
  await retry.get('#membership-retry').fire('click');
  assert.equal(retry.get('#membership-account').hidden, false);
  assert.equal(retry.get('#membership-status').hidden, true);
  pass('connection failure is visible and Try again recovers the correct account');

  for (const result of [
    { ok: true, json: async () => { throw new SyntaxError('HTML instead of JSON'); } },
    response({ unexpected: true })
  ]) {
    const bad = page(async () => result);
    await settle(() => !bad.get('#membership-retry').hidden);
    assert.equal(bad.get('#membership-status').hidden, false);
    assert.equal(bad.get('#membership-guest').hidden, true);
  }
  pass('non-JSON static-server responses and incorrect API responses show an error');

  const expired = page(async url => url === '/api/me'
    ? response({ user: member })
    : response({ error: 'Please sign in first.' }, 401));
  await settle(() => expired.get('#membership-status').hidden);
  await expired.get('#membership-form').fire('submit');
  assert.equal(expired.get('#membership-account').hidden, true);
  assert.equal(expired.get('#membership-guest').hidden, false);
  assert.equal(expired.get('#membership-signin-notice').hidden, false);
  assert.match(expired.get('#membership-signin-notice').textContent, /session has expired/);
  pass('expired-session save returns to sign-in with a visible explanation');

  const saving = deferred();
  const busy = page(async url => url === '/api/me' ? response({ user: member }) : saving.promise);
  await settle(() => busy.get('#membership-status').hidden);
  busy.get('#member-plan').value = 'elite';
  const firstSave = busy.get('#membership-form').fire('submit');
  assert.equal(busy.get('#member-plan').disabled, true);
  assert.equal(busy.get('#membership-form').querySelector('button[type="submit"]').disabled, true);
  await busy.get('#membership-form').fire('submit');
  assert.equal(busy.requests.filter(r => r.url === '/api/membership').length, 1);
  saving.resolve(response({ user: { ...member, plan: 'elite' } }));
  await firstSave;
  assert.equal(busy.get('#member-plan').disabled, false);
  assert.equal(busy.get('#membership-form').querySelector('button[type="submit"]').disabled, false);
  pass('pending save blocks duplicate updates and re-enables controls afterwards');

  const failed = page(async url => {
    if (url === '/api/me') return response({ user: member });
    throw new Error('Connection dropped');
  });
  await settle(() => failed.get('#membership-status').hidden);
  failed.get('#member-plan').value = 'elite';
  await failed.get('#membership-form').fire('submit');
  assert.equal(failed.get('#current-plan').textContent, 'Basic');
  assert.equal(failed.get('#member-plan').value, 'elite');
  assert.equal(failed.get('#member-plan').disabled, false);
  assert.match(failed.get('#membership-form').querySelector('.form-message').textContent, /Cannot connect/);
  pass('failed save keeps the saved value and preserves the unsaved choice for retry');

  const timeout = page((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
  }), '', true);
  await settle(() => !timeout.get('#membership-retry').hidden);
  assert.equal(timeout.get('#membership-status').hidden, false);
  pass('a stalled account request times out and offers retry');

  const saveTimeout = page((url, options) => url === '/api/me'
    ? Promise.resolve(response({ user: member }))
    : new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })), '', true);
  await settle(() => saveTimeout.get('#membership-status').hidden);
  await saveTimeout.get('#membership-form').fire('submit');
  assert.equal(saveTimeout.get('#member-plan').disabled, false);
  assert.equal(saveTimeout.get('#current-plan').textContent, 'Basic');
  pass('a stalled save times out without locking the form or showing false success');
}

async function addedChecks() {
  const auth = page(async (url, options) => url === '/api/me' ? response({user:null}) : response({user:member}, 201), '?tab=register&plan=elite', false, 'login');
  await new Promise(resolve => setImmediate(resolve));
  auth.get('#register-name').value = 'DoBu Test';
  auth.get('#register-email').value = 'test@example.com';
  auth.get('#register-password').value = 'DoBuTest123!';
  auth.get('#register-confirm').value = 'Different123!';
  await auth.get('#register-form').fire('submit');
  assert.equal(auth.requests.filter(r => r.url === '/api/register').length, 0);
  assert.match(auth.get('#register-confirm-error').textContent, /Passwords do not match/);
  auth.get('#register-confirm').value = 'DoBuTest123!';
  await auth.get('#register-form').fire('submit');
  assert.equal(auth.requests.filter(r => r.url === '/api/register').length, 1);
  assert.equal(auth.location.href, '/membership.html?plan=elite');
  pass('registration mismatch is rejected before a request and valid registration preserves the chosen plan');
  const login = page(async url => url === '/api/me' ? response({user:null}) : response({error:'Incorrect email or password.'},401), '', false,'login');
  await new Promise(resolve => setImmediate(resolve));
  login.get('#login-email').value = 'test@example.com'; login.get('#login-password').value = 'WrongTest123!';
  await login.get('#login-form').fire('submit');
  assert.match(login.get('#login-form').querySelector('.form-message').textContent, /Incorrect email or password/);
  await login.get('#login-tab').fire('keydown',{key:'ArrowRight'});
  assert.equal(login.get('#register-tab').getAttribute('aria-selected'),'true');
  assert.equal(login.get('#register-form').hidden,false);
  assert.equal(login.get('#register-tab').focused,true);
  pass('invalid login displays feedback and keyboard arrows switch the account tabs');
  let online=false;
  const community=page(async url=>{
    if(url==='/api/me') return response({user:member});
    if(!online)throw new Error('Unavailable');
    return response({posts:[]});
  },'',false,'community');
  await settle(()=>!community.get('#posts-retry').hidden);
  online=true;await community.get('#posts-retry').fire('click');
  assert.equal(community.get('#posts-retry').hidden,true);
  assert.match(community.get('#post-list').children[0].textContent,/No posts yet/);
  pass('Community loading failure can be retried and becomes a useful empty state');
  const posting=deferred();
  const post=page(async(url)=> url==='/api/me'?response({user:member}):url==='/api/posts'?response({posts:[]}):posting.promise,'',false,'community');
  await new Promise(resolve=>setImmediate(resolve));
  // Delay only the POST, while the initial GET continues to return an empty discussion.
  post.context.fetch=async(url,options)=>{
    post.requests.push({url,options});
    if(options.method==='POST')return posting.promise;
    return response({posts:[]});
  };
  post.get('#post-text').value='This is a test community post.';
  const send=post.get('#post-form').fire('submit');
  await post.get('#post-form').fire('submit');
  assert.equal(post.requests.filter(r=>r.options.method==='POST').length,1);
  posting.resolve(response({post:{id:'test-post'}},201)); await send;
  assert.equal(post.get('#post-form').getAttribute('aria-busy'),null);
  pass('Community publish prevents duplicate submissions while a request is pending');
  const saving=deferred();
  const contact=page(async(url)=>url==='/api/me'?response({user:null}):saving.promise,'',false,'contact');
  await new Promise(resolve=>setImmediate(resolve));
  contact.get('#contact-name').value='Enquiry Test';contact.get('#contact-email').value='test@example.com';contact.get('#contact-message').value='Please tell me about the beginner classes.';
  const saved=contact.get('#contact-form').fire('submit');
  await contact.get('#contact-form').fire('submit');
  assert.equal(contact.requests.filter(r=>r.url==='/api/contact').length,1);
  saving.resolve(response({message:'Your message has been saved in this demo.'},201));await saved;
  assert.equal(contact.get('#contact-form').getAttribute('aria-busy'),null);
  assert.match(contact.get('#contact-form').querySelector('.form-message').textContent,/saved in this demo/);
  pass('Contact saves one request and displays the stored enquiry acknowledgement');
  const preview=page(async url=>url==='/api/me'?response({user:null}):response({posts:[]}),'?plan=elite',false,'membership','5500');
  assert.equal(preview.document.body.prepended.length,1);
  assert.equal(preview.document.body.prepended[0].children[1].href,'http://localhost:3000/membership.html?plan=elite');
  pass('Live Server preview provides a link to the Node page and retains the plan query');
}

(async () => {
  await uiChecks();
  await addedChecks();
  console.log(`\n${checks} frontend regression groups passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
