// main.js — hash router + the four view renderers.
// Routes:
//   #/                              bounty board
//   #/bounty/<slug>                 one bounty
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/account/<id>                  an account's public profile
//
// render() sets window.__shotReady = false when a route starts loading
// and true once its data has rendered (screenshot scripts wait on it).

import { getBounties, getBounty, getLeaderboard, getAccount } from "./api.js";
import { boardView, bountyView, leaderboardView, profileView } from "./views.js";
import { esc } from "./format.js";

const app = document.getElementById("app");
const pill = document.getElementById("api-status");

function setStatus(text, ok) {
  if (!pill) return;
  pill.textContent = text;
  pill.classList.toggle("ok", !!ok);
  pill.classList.toggle("bad", !ok);
}

function loadingView(what) {
  return `<p class="loading" role="status">Loading ${esc(what)}…</p>`;
}

function errorView(message, homeLink = true) {
  return `<div class="error">
    <h2>Something went wrong</h2>
    <p>${esc(message)}</p>
    ${homeLink ? `<p><a class="btn" href="#/">Back to bounties</a></p>` : ""}
  </div>`;
}

function parseRoute() {
  const hash = window.location.hash || "#/";
  const path = hash.replace(/^#/, "") || "/";
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "board" };
  if (parts[0] === "bounty" && parts[1] && parts[2] === "leaderboard") {
    return { name: "leaderboard", slug: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "bounty" && parts[1]) {
    return { name: "bounty", slug: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === "account" && parts[1]) {
    return { name: "account", id: decodeURIComponent(parts[1]) };
  }
  return { name: "board" };
}

async function renderBoard() {
  app.innerHTML = loadingView("bounties");
  const bounties = await getBounties();
  setStatus("Live API", true);
  app.innerHTML = boardView(bounties);
}

async function renderBounty(slug) {
  app.innerHTML = loadingView("bounty");
  const bounty = await getBounty(slug);
  setStatus("Live API", true);
  app.innerHTML = bountyView(bounty);
  document.title = `${bounty.title ?? slug} — make.fun`;
}

async function renderLeaderboard(slug) {
  app.innerHTML = loadingView("leaderboard");
  const lb = await getLeaderboard(slug);
  const title = lb.title || lb.competition?.title || slug;
  setStatus("Live API", true);
  app.innerHTML = leaderboardView(slug, title, lb);
  document.title = `Leaderboard: ${title} — make.fun`;
}

async function renderAccount(id) {
  app.innerHTML = loadingView("profile");
  const account = await getAccount(id);
  setStatus("Live API", true);
  app.innerHTML = profileView(account);
  const name = account.display_name ?? account.handle ?? id;
  document.title = `${name} — make.fun`;
}

async function render() {
  window.__shotReady = false;
  document.title = "make.fun — open bounties";
  const route = parseRoute();
  try {
    if (route.name === "bounty") await renderBounty(route.slug);
    else if (route.name === "leaderboard") await renderLeaderboard(route.slug);
    else if (route.name === "account") await renderAccount(route.id);
    else await renderBoard();
  } catch (err) {
    console.error(err);
    setStatus("API error", false);
    app.innerHTML = errorView(err?.message ?? "Could not load data from make.fun.");
  } finally {
    window.__shotReady = true;
    window.scrollTo(0, 0);
  }
}

window.addEventListener("hashchange", render);
render();
