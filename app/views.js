// views.js — template functions for the four surfaces.
// Each returns an HTML string. All user/API text goes through esc().
// Avatar <img> tags always set crossorigin="anonymous" BEFORE src,
// because make.fun avatars send Cross-Origin-Resource-Policy: same-origin.

import { esc, val, money, date, left, num } from "./format.js";

/** Avatar image (or a coloured initial when there is none). */
export function avatarImg(account, size = 40) {
  let src = val(account?.image, account?.avatar, account?.avatarUrl, account?.picture);
  // The API often returns a root-relative path such as
  // /api/avatars/<hash>.webp — resolve it against make.fun, or the
  // browser would request it from our own origin and get a 404.
  if (src && src.startsWith("/")) src = "https://make.fun" + src;
  const name = val(account?.display_name, account?.displayName, account?.name, account?.handle, "?");
  const initial = String(name).trim().charAt(0).toUpperCase() || "?";
  if (src) {
    return `<img class="avatar" width="${size}" height="${size}" crossorigin="anonymous" src="${esc(src)}" alt="${esc(name)}" loading="lazy" onerror="this.outerHTML='<span class=\\'avatar avatar-fallback\\'>${esc(initial)}</span>'">`;
  }
  return `<span class="avatar avatar-fallback" style="width:${size}px;height:${size}px">${esc(initial)}</span>`;
}

function isOpen(bounty, now = Date.now()) {
  const deadline = val(bounty.deadline, bounty.endsAt, bounty.ends_at);
  const accepting = bounty.acceptingSubmissions;
  if (accepting === false) return false;
  if (deadline) {
    const end = new Date(deadline).getTime();
    if (!Number.isNaN(end) && end <= now) return false;
  }
  const status = String(val(bounty.status, "")).toLowerCase();
  return status === "" || status === "open";
}

function pot(bounty) {
  return val(bounty.potUsd, bounty.livePotUsd, bounty.rewardAmount, bounty.reward, bounty.pot);
}

function fee(bounty) {
  const fee = val(bounty.entryFeeUsd, bounty.entryFee, bounty.entryFeesUsd);
  if (fee === null || fee === undefined || fee === "") return null;
  return Number(fee);
}

function feeLabel(bounty) {
  const f = fee(bounty);
  if (f === null) return "Free";
  if (f === 0) return "Free";
  return money(f);
}

function entriesCount(bounty) {
  return val(bounty.submissionCount, bounty.entriesCount, bounty.entryCount, bounty.entries?.length, 0);
}

/** One bounty card for the board. */
export function bountyCard(bounty) {
  const slug = val(bounty.slug, bounty.id);
  const title = val(bounty.title, bounty.name, slug);
  const summary = val(bounty.summary, bounty.description, "");
  const deadline = val(bounty.deadline, bounty.endsAt, bounty.ends_at);
  const open = isOpen(bounty);
  return `
  <article class="card">
    <a class="card-link" href="#/bounty/${esc(slug)}">
      <h3 class="card-title">${esc(title)}</h3>
    </a>
    <p class="card-summary">${esc(String(summary).slice(0, 220))}</p>
    <div class="card-meta">
      <span class="pot" title="Live pot">${money(pot(bounty))}</span>
      <span class="pill ${open ? "pill-live" : "pill-closed"}">${open ? "● Live" : "Closed"}</span>
    </div>
    <dl class="card-facts">
      <div><dt>Entry fee</dt><dd>${esc(feeLabel(bounty))}</dd></div>
      <div><dt>Time left</dt><dd>${esc(left(deadline) || "—")}</dd></div>
      <div><dt>Entries</dt><dd>${esc(num(entriesCount(bounty)))}</dd></div>
    </dl>
    <a class="btn" href="#/bounty/${esc(slug)}">View bounty →</a>
  </article>`;
}

/** The bounty board: hero + cards for live bounties. */
export function boardView(bounties) {
  const live = bounties.filter((b) => isOpen(b));
  const closed = bounties.filter((b) => !isOpen(b));
  const ordered = [...live, ...closed];
  const cards = ordered.map(bountyCard).join("\n");
  return `
  <section class="hero">
    <h1>Open bounties on make.fun</h1>
    <p class="hero-sub">Build agents and programs, enter competitions, get scored and ranked in the open. Live pots, entry fees and time left — straight from the public make.fun API.</p>
    <p class="hero-stats"><strong>${live.length}</strong> live now · <strong>${bounties.length}</strong> listed</p>
  </section>
  ${ordered.length === 0 ? `<p class="empty">No bounties found right now. Try again in a moment.</p>` : ""}
  <section class="grid" aria-label="Bounties">
    ${cards}
  </section>`;
}

/** Rewards table for a bounty page. */
function rewardsTable(bounty) {
  const rows = val(bounty.rewardsNow, bounty.rewards, null);
  let body = "";
  if (Array.isArray(rows)) {
    body = rows.slice(0, 20).map((r) => {
      const place = val(r.place, r.rank, "?");
      const amount = val(r.amountUsd, r.amount, r.usd, r.value);
      return `<tr><td>#${esc(place)}</td><td>${esc(money(amount))}</td></tr>`;
    }).join("\n");
  } else if (rows && typeof rows === "object") {
    body = Object.entries(rows).slice(0, 20).map(([place, amount]) =>
      `<tr><td>#${esc(place)}</td><td>${esc(money(amount))}</td></tr>`).join("\n");
  }
  if (!body) return `<p class="muted">Reward split not published yet — live pot ${esc(money(pot(bounty)))}.</p>`;
  return `
  <table class="table">
    <thead><tr><th>Place</th><th>Reward</th></tr></thead>
    <tbody>${body}</tbody>
  </table>
  <p class="muted">Live pot: <strong class="pot">${esc(money(pot(bounty)))}</strong></p>`;
}

/** One bounty's page. */
export function bountyView(bounty) {
  const slug = val(bounty.slug, bounty.id);
  const title = val(bounty.title, bounty.name, slug);
  const summary = val(bounty.summary, "");
  const description = val(bounty.description, "");
  const rules = val(bounty.rules, bounty.rulesNote, "");
  const deadline = val(bounty.deadline, bounty.endsAt, bounty.ends_at);
  const published = val(bounty.publishedAt, bounty.opensAt);
  const open = isOpen(bounty);
  const category = val(bounty.category, "");
  const skills = Array.isArray(bounty.skills) ? bounty.skills : [];
  return `
  <article class="bounty">
    <p class="crumbs"><a href="#/">← All bounties</a></p>
    <h1>${esc(title)}</h1>
    <p class="bounty-summary">${esc(summary)}</p>
    <div class="card-meta">
      <span class="pot pot-big" title="Live pot">${esc(money(pot(bounty)))}</span>
      <span class="pill ${open ? "pill-live" : "pill-closed"}">${open ? "● Live" : "Closed"}</span>
      ${category ? `<span class="pill">${esc(category)}</span>` : ""}
    </div>
    <dl class="facts">
      <div><dt>Entry fee</dt><dd>${esc(feeLabel(bounty))}</dd></div>
      <div><dt>Time left</dt><dd>${esc(left(deadline) || "—")}</dd></div>
      <div><dt>Deadline</dt><dd>${esc(date(deadline))}</dd></div>
      <div><dt>Opens</dt><dd>${esc(date(published))}</dd></div>
      <div><dt>Entries</dt><dd>${esc(num(entriesCount(bounty)))}</dd></div>
    </dl>
    ${skills.length ? `<p class="tags">${skills.map((s) => `<span class="tag">${esc(s)}</span>`).join(" ")}</p>` : ""}
    <p><a class="btn" href="#/bounty/${esc(slug)}/leaderboard">View leaderboard →</a></p>
    ${description ? `<section class="section"><h2>About</h2><div class="prose">${esc(description)}</div></section>` : ""}
    ${rules ? `<section class="section"><h2>Rules</h2><div class="prose">${esc(rules)}</div></section>` : ""}
    <section class="section"><h2>Rewards</h2>${rewardsTable(bounty)}</section>
  </article>`;
}

function scoreOf(entry, rankKey) {
  const display = entry.display ?? {};
  const values = entry.values ?? {};
  const direct = val(entry.score, entry[rankKey], display[rankKey], values[rankKey], entry.elo, entry.points);
  if (direct !== "" && direct !== null && direct !== undefined) return String(direct);
  const first = Object.values(values)[0];
  return first === undefined ? "—" : String(first);
}

/** Leaderboard page for a bounty. */
export function leaderboardView(slug, title, lb) {
  const entries = lb.entries ?? [];
  const rows = entries.slice(0, 100).map((e) => {
    const rank = val(e.rank, e.ranks?.overall, e.prize_rank, "?");
    const handle = val(e.handle, e.account, e.builder, e.username, "unknown");
    const entryTitle = val(e.title, e.name, e.submission_id, "");
    const result = val(e.status, e.result, e.state, "");
    return `
    <tr>
      <td class="rank">#${esc(rank)}</td>
      <td>
        <a class="row-link" href="#/account/${esc(handle)}">
          ${avatarImg({ handle, image: val(e.image, e.avatar) }, 28)}
          <span>${esc(handle)}</span>
        </a>
      </td>
      <td>${esc(entryTitle)}</td>
      <td class="score">${esc(scoreOf(e, lb.rankKey))}</td>
      <td>${esc(result)}</td>
    </tr>`;
  }).join("\n");
  return `
  <section>
    <p class="crumbs"><a href="#/bounty/${esc(slug)}">← ${esc(title || slug)}</a> · <a href="#/">All bounties</a></p>
    <h1>Leaderboard</h1>
    <p class="muted">${esc(title || slug)} — ${esc(num(entries.length))} ranked entries${lb.rankKey ? ` · ranked by ${esc(lb.rankKey)}` : ""}</p>
    ${entries.length === 0
      ? `<p class="empty">No leaderboard entries yet for this bounty.</p>`
      : `<table class="table leaderboard">
        <thead><tr><th>Rank</th><th>Builder</th><th>Entry</th><th>Score</th><th>Result</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`}
  </section>`;
}

/** Account profile page. */
export function profileView(account) {
  const handle = val(account.handle, account.username, account.id, "unknown");
  const name = val(account.display_name, account.displayName, account.name, handle);
  const bio = val(account.bio, account.about, "");
  const record = account.record ?? {};
  const solutions = Array.isArray(account.solutions) ? account.solutions : (Array.isArray(account.entries) ? account.entries : []);
  const stats = [
    ["Entries", val(record.competitions_entered, record.entries, solutions.length)],
    ["Placed", val(record.competitions_placed, record.placed, "—")],
    ["Wins", val(record.competitions_won, record.wins, "—")],
    ["Best placement", val(record.best_placement, record.bestPlacement, "—")],
    ["Prize money", val(record.prize_usd, record.prizeUsd) !== "" ? money(val(record.prize_usd, record.prizeUsd)) : "—"],
  ];
  const items = solutions.slice(0, 20).map((s) => {
    const comp = s.competition ?? {};
    const cslug = val(comp.slug, s.competition_slug, "");
    const ctitle = val(comp.title, s.competition_title, cslug);
    const stitle = val(s.title, s.name, "");
    const placement = val(s.placement, s.rank, "");
    const score = val(s.score, "");
    return `<li class="entry-item">
      <div>
        ${cslug ? `<a href="#/bounty/${esc(cslug)}">${esc(ctitle)}</a>` : esc(ctitle)}
        <span class="entry-title">${esc(stitle)}</span>
      </div>
      <div class="entry-meta">
        ${placement !== "" ? `<span>Placed #${esc(placement)}</span>` : ""}
        ${score !== "" ? `<span>Score ${esc(score)}</span>` : ""}
        ${s.entered_at ? `<span>${esc(date(s.entered_at))}</span>` : ""}
      </div>
    </li>`;
  }).join("\n");
  return `
  <section class="profile">
    <p class="crumbs"><a href="#/">← All bounties</a></p>
    <div class="profile-head">
      ${avatarImg(account, 72)}
      <div>
        <h1>${esc(name)}</h1>
        <p class="handle">@${esc(handle)}</p>
        ${bio ? `<p class="bio">${esc(bio)}</p>` : ""}
        ${account.joined_at ? `<p class="muted">Joined ${esc(date(account.joined_at))}</p>` : ""}
      </div>
    </div>
    <dl class="facts">
      ${stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n")}
    </dl>
    <section class="section">
      <h2>Recent entries</h2>
      ${items ? `<ul class="entry-list">${items}</ul>` : `<p class="muted">No public entries listed.</p>`}
    </section>
  </section>`;
}
