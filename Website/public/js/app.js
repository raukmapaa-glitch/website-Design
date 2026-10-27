"use strict";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const planNames = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
  junior: "Junior"
};

let currentUser = null;
let membershipState = "loading";
let membershipError = "";

async function request(url, options = {}) {
  const controller = new AbortController();
  const callerSignal = options.signal;
  const abort = () => controller.abort();
  if (callerSignal?.aborted) controller.abort();
  else callerSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 10000);
  const config = { credentials: "same-origin", ...options, signal: controller.signal };
  if (config.body) config.headers = { "Content-Type": "application/json", ...config.headers };

  try {
    let response;
    try {
      response = await fetch(url, config);
    } catch {
      throw new Error(controller.signal.aborted
        ? "The request timed out. Please try again."
        : "Cannot connect to the website server. Start the website and open http://localhost:3000.");
    }
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("The server returned an invalid response. Open the working website and try again.");
    }
    if (!response.ok) {
      const error = new Error(data?.error || "Something went wrong.");
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abort);
  }
}

function message(form, text, success = false) {
  const target = $(".form-message", form);
  if (!target) return;
  target.textContent = text;
  target.classList.toggle("success", success);
  target.classList.toggle("success-message", success);
}

function formBusy(form, busy) {
  const button = $('button[type="submit"]', form);
  if (busy) form.setAttribute("aria-busy", "true");
  else form.removeAttribute("aria-busy");
  if (button) button.disabled = busy;
}

function setUser(user) {
  currentUser = user;
  membershipState = "ready";
  membershipError = "";

  const action = $("[data-account-link]");
  if (action) {
    action.textContent = user ? "My account" : "Join now";
    action.href = user ? "/membership.html" : "/login.html";
  }

  if (document.body.dataset.page === "membership") renderMembership();
  if (document.body.dataset.page === "community") renderComposer();
}

function renderMembership() {
  const guest = $("#membership-guest");
  const account = $("#membership-account");
  if (!guest || !account) return;

  const ready = membershipState === "ready";
  guest.hidden = !ready || Boolean(currentUser);
  account.hidden = !ready || !currentUser;

  const status = $("#membership-status");
  const heading = $("#membership-status-heading");
  const detail = $("#membership-status-message");
  const retry = $("#membership-retry");
  if (status) status.hidden = ready;
  if (heading) heading.textContent = membershipState === "error"
    ? "Your account couldn't be loaded."
    : "Loading your account…";
  if (detail) detail.textContent = membershipState === "error"
    ? membershipError
    : "Checking your sign-in status. Please wait.";
  if (retry) retry.hidden = membershipState !== "error";

  const params = new URLSearchParams(location.search);
  const selected = params.get("plan");

  if (selected && planNames[selected]) {
    const registerLink = $("#membership-register-link");
    const loginLink = $("#membership-login-link");

    if (registerLink) {
      registerLink.href = `/login.html?tab=register&plan=${encodeURIComponent(selected)}`;
    }
    if (loginLink) {
      loginLink.href = `/login.html?plan=${encodeURIComponent(selected)}`;
    }
  }

  if (!ready || !currentUser) return;

  const name = $("#member-name");
  const email = $("#member-email");
  const currentPlan = $("#current-plan");
  const select = $("#member-plan");

  if (name) name.textContent = currentUser.name;
  if (email) email.textContent = currentUser.email;
  if (currentPlan) {
    currentPlan.textContent = currentUser.plan
      ? planNames[currentUser.plan]
      : "No plan selected";
  }

  if (select) {
    if (selected && planNames[selected]) select.value = selected;
    else select.value = currentUser.plan || "";
  }
}

function renderComposer() {
  const guest = $("#community-guest");
  const composer = $("#post-form");

  if (guest) guest.hidden = Boolean(currentUser);
  if (composer) composer.hidden = !currentUser;
}

function setTab(name) {
  const login = $("#login-form");
  const register = $("#register-form");
  if (!login || !register) return;

  $$('[data-tab]').forEach(button => {
    button.setAttribute("aria-selected", String(button.dataset.tab === name));
    button.tabIndex = button.dataset.tab === name ? 0 : -1;
  });

  login.hidden = name !== "login";
  register.hidden = name !== "register";
}

function redirectAfterAuth() {
  const params = new URLSearchParams(location.search);
  const next = params.get("next");
  const plan = params.get("plan");

  if (next === "community") {
    location.href = "/community.html";
    return;
  }

  location.href = plan
    ? `/membership.html?plan=${encodeURIComponent(plan)}`
    : "/membership.html";
}

function showFieldError(input, errorElement, text) {
  if (errorElement) errorElement.textContent = text;
  if (input) {
    input.classList.add("input-error");
    input.setAttribute("aria-invalid", "true");
  }
}

function clearFieldError(input, errorElement) {
  if (errorElement) errorElement.textContent = "";
  if (input) {
    input.classList.remove("input-error");
    input.removeAttribute("aria-invalid");
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateLogin(form) {
  const email = $("#login-email", form);
  const password = $("#login-password", form);
  const emailError = $("#login-email-error", form);
  const passwordError = $("#login-password-error", form);

  let valid = true;

  const emailValue = email?.value.trim() || "";
  const passwordValue = password?.value || "";

  if (!emailValue) {
    showFieldError(email, emailError, "Please enter your email address.");
    valid = false;
  } else if (!isValidEmail(emailValue)) {
    showFieldError(email, emailError, "Please enter a valid email address.");
    valid = false;
  } else {
    clearFieldError(email, emailError);
  }

  if (!passwordValue) {
    showFieldError(password, passwordError, "Please enter your password.");
    valid = false;
  } else {
    clearFieldError(password, passwordError);
  }

  return valid;
}

function validateRegister(form) {
  const name = $("#register-name", form);
  const email = $("#register-email", form);
  const password = $("#register-password", form);
  const confirm = $("#register-confirm", form);

  const nameError = $("#register-name-error", form);
  const emailError = $("#register-email-error", form);
  const passwordError = $("#register-password-error", form);
  const confirmError = $("#register-confirm-error", form);

  let valid = true;

  const nameValue = name?.value.trim() || "";
  const emailValue = email?.value.trim() || "";
  const passwordValue = password?.value || "";
  const confirmValue = confirm?.value || "";

  if (!nameValue) {
    showFieldError(name, nameError, "Please enter your name.");
    valid = false;
  } else if (nameValue.length < 2) {
    showFieldError(name, nameError, "Name must contain at least 2 characters.");
    valid = false;
  } else {
    clearFieldError(name, nameError);
  }

  if (!emailValue) {
    showFieldError(email, emailError, "Please enter your email address.");
    valid = false;
  } else if (!isValidEmail(emailValue)) {
    showFieldError(email, emailError, "Please enter a valid email address.");
    valid = false;
  } else {
    clearFieldError(email, emailError);
  }

  if (!passwordValue) {
    showFieldError(password, passwordError, "Please enter a password.");
    valid = false;
  } else if (passwordValue.length < 10) {
    showFieldError(password, passwordError, "Password must be at least 10 characters.");
    valid = false;
  } else if (passwordValue.length > 128) {
    showFieldError(password, passwordError, "Password must be 128 characters or fewer.");
    valid = false;
  } else {
    clearFieldError(password, passwordError);
  }

  if (!confirmValue) {
    showFieldError(confirm, confirmError, "Please confirm your password.");
    valid = false;
  } else if (confirmValue !== passwordValue) {
    showFieldError(confirm, confirmError, "Passwords do not match.");
    valid = false;
  } else {
    clearFieldError(confirm, confirmError);
  }

  return valid;
}

function initAuthForms() {
  const login = $("#login-form");
  const register = $("#register-form");
  if (!login && !register) return;

  $$('[data-tab]').forEach(button => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
    button.addEventListener("keydown", event => {
      const tabs = $$('[data-tab]');
      const index = tabs.indexOf(button);
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      setTab(tabs[next].dataset.tab);
      tabs[next].focus();
    });
  });

  const params = new URLSearchParams(location.search);
  setTab(params.get("tab") === "register" ? "register" : "login");

  if (login) {
    const email = $("#login-email", login);
    const password = $("#login-password", login);
    const emailError = $("#login-email-error", login);
    const passwordError = $("#login-password-error", login);

    email?.addEventListener("input", () => clearFieldError(email, emailError));
    password?.addEventListener("input", () => clearFieldError(password, passwordError));

    login.addEventListener("submit", async event => {
      event.preventDefault();
      message(login, "");

      if (!validateLogin(login)) return;

      const data = Object.fromEntries(new FormData(login));

      try {
        const result = await request("/api/login", {
          method: "POST",
          body: JSON.stringify(data)
        });
        setUser(result.user);
        redirectAfterAuth();
      } catch (error) {
        message(login, error.message);
      }
    });
  }

  if (register) {
    const name = $("#register-name", register);
    const email = $("#register-email", register);
    const password = $("#register-password", register);
    const confirm = $("#register-confirm", register);

    const nameError = $("#register-name-error", register);
    const emailError = $("#register-email-error", register);
    const passwordError = $("#register-password-error", register);
    const confirmError = $("#register-confirm-error", register);

    name?.addEventListener("input", () => clearFieldError(name, nameError));
    email?.addEventListener("input", () => clearFieldError(email, emailError));
    password?.addEventListener("input", () => clearFieldError(password, passwordError));
    confirm?.addEventListener("input", () => clearFieldError(confirm, confirmError));

    register.addEventListener("submit", async event => {
      event.preventDefault();
      message(register, "");

      if (!validateRegister(register)) return;

      const data = Object.fromEntries(new FormData(register));
      delete data.confirm;

      try {
        const result = await request("/api/register", {
          method: "POST",
          body: JSON.stringify(data)
        });
        setUser(result.user);
        redirectAfterAuth();
      } catch (error) {
        message(register, error.message);
      }
    });
  }
}

function initMembership() {
  const form = $("#membership-form");
  const retry = $("#membership-retry");
  if (retry) retry.addEventListener("click", loadCurrentUser);

  if (form) {
    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (form.getAttribute("aria-busy") === "true") return;
      message(form, "");

      const select = $("#member-plan");
      const button = $('button[type="submit"]', form);
      const plan = select?.value || null;
      form.setAttribute("aria-busy", "true");
      if (select) select.disabled = true;
      if (button) {
        button.disabled = true;
        button.textContent = "Saving…";
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await request("/api/membership", {
          method: "PUT",
          body: JSON.stringify({ plan }),
          signal: controller.signal
        });

        history.replaceState(null, "", "/membership.html");
        setUser(result.user);
        message(form, "Your plan preference has been saved.", true);
      } catch (error) {
        if (error.status === 401) {
          setUser(null);
          const notice = $("#membership-signin-notice");
          if (notice) {
            notice.textContent = "Your session has expired. Please sign in again to save your plan.";
            notice.hidden = false;
          }
        } else {
          message(form, error.message);
        }
      } finally {
        clearTimeout(timeout);
        form.removeAttribute("aria-busy");
        if (select) select.disabled = false;
        if (button) {
          button.disabled = false;
          button.textContent = "Save preference";
        }
      }
    });
  }

  const logout = $("#logout-button");
  if (logout) {
    logout.addEventListener("click", async () => {
      try {
        await request("/api/logout", {
          method: "POST",
          body: "{}"
        });
        setUser(null);
        location.href = "/index.html";
      } catch (error) {
        alert(error.message);
      }
    });
  }
}

function postElement(post) {
  const article = document.createElement("article");
  article.className = "post";

  const head = document.createElement("div");
  head.className = "post-head";

  const author = document.createElement("strong");
  const time = document.createElement("time");
  const body = document.createElement("p");

  author.textContent = post.author;
  time.dateTime = post.created;
  time.textContent = new Date(post.created).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
  body.textContent = post.text;

  head.append(author, time);
  article.append(head, body);
  return article;
}

async function loadPosts() {
  const list = $("#post-list");
  if (!list) return;
  const retry = $("#posts-retry");
  if (retry) retry.hidden = true;
  list.textContent = "Loading posts…";

  try {
    const { posts } = await request("/api/posts");
    if (!Array.isArray(posts)) throw new Error("The discussion response was not valid.");
    list.replaceChildren();

    if (!posts.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No posts yet. Start the first discussion!";
      list.append(empty);
      return;
    }

    posts.forEach(post => list.append(postElement(post)));
  } catch (error) {
    list.textContent = "Could not load the discussion. Please try again.";
    if (retry) retry.hidden = false;
  }
}

function initCommunity() {
  if (!$("#post-list") && !$("#post-form")) return;

  loadPosts();
  const retry = $("#posts-retry");
  if (retry) retry.addEventListener("click", loadPosts);

  const form = $("#post-form");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (form.getAttribute("aria-busy") === "true") return;
    message(form, "");
    formBusy(form, true);

    try {
      await request("/api/posts", {
        method: "POST",
        body: JSON.stringify({ text: $("#post-text")?.value || "" })
      });

      form.reset();
      message(form, "Your post is live.", true);
      await loadPosts();
    } catch (error) {
      message(form, error.message);
    } finally {
      formBusy(form, false);
    }
  });
}

function initContact() {
  const form = $("#contact-form");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (form.getAttribute("aria-busy") === "true") return;
    message(form, "");
    const data = Object.fromEntries(new FormData(form));
    formBusy(form, true);

    try {
      const result = await request("/api/contact", {
        method: "POST",
        body: JSON.stringify(data)
      });

      form.reset();
      message(form, result.message, true);
    } catch (error) {
      message(form, error.message);
    } finally {
      formBusy(form, false);
    }
  });
}

function initNavigation() {
  const toggle = $("#menu-toggle");
  const nav = $("#main-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function showLocalPreviewHelp() {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) || location.port !== "5500") return;
  const notice = document.createElement("aside");
  notice.className = "runtime-notice";
  notice.setAttribute("aria-label", "Local preview information");
  const text = document.createElement("p");
  text.textContent = "This is a static preview. Open the working website to use accounts, membership preferences and community posts.";
  const link = document.createElement("a");
  link.className = "button dark small";
  link.href = `http://localhost:3000${location.pathname}${location.search}${location.hash}`;
  link.textContent = "Open working website";
  notice.append(text, link);
  document.body.prepend(notice);
}

async function loadCurrentUser() {
  membershipState = "loading";
  membershipError = "";
  renderMembership();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const result = await request("/api/me", { signal: controller.signal });
    if (!result || !Object.prototype.hasOwnProperty.call(result, "user")) {
      throw new Error("The account service is unavailable. Open the website using START_WEBSITE.bat, then try again.");
    }
    setUser(result.user);
  } catch (error) {
    setUser(null);
    membershipState = "error";
    membershipError = error.message;
    renderMembership();
  } finally {
    clearTimeout(timeout);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showLocalPreviewHelp();
  initNavigation();
  initAuthForms();
  initMembership();
  initCommunity();
  initContact();

  loadCurrentUser();
});
