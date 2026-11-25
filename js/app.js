import { I18N, formatMoney, formatColFull } from "./i18n.js";
import { RobRunScanner, evaluateItem } from "./scanner.js";

const scanner = new RobRunScanner();

const state = {
  lang: localStorage.getItem("rr_lang") || (navigator.language?.toLowerCase().startsWith("de") ? "de" : "en"),
  enabledTiers: { Basic: true, Additional: true, Special: true, Unique: true },
  showKeepBadges: true,
  sellScope: "tab", // "tab" | "all"
  tabs: [], // { id, name, img, scan, gridOverride }
  activeTabId: null,
  hoveredSlotId: null,
  selectedSlotId: null,
  nextTabNum: 1,
};

const els = {
  dbStatus: document.getElementById("db-status"),
  fileInput: document.getElementById("file-input"),
  browseBtn: document.getElementById("browse-btn"),
  addMoreBtn: document.getElementById("add-more-btn"),
  clearAllBtn: document.getElementById("clear-all-btn"),
  emptyState: document.getElementById("empty-state"),
  scannerView: document.getElementById("scanner-view"),
  tabsList: document.getElementById("tabs-list"),
  canvas: document.getElementById("overlay-canvas"),
  scanSpinner: document.getElementById("scan-spinner"),
  toggleKeep: document.getElementById("toggle-keep-badges"),
  downloadBtn: document.getElementById("download-png-btn"),
  copyBtn: document.getElementById("copy-png-btn"),
  gridAdjustBtn: document.getElementById("grid-adjust-btn"),
  gridPanel: document.getElementById("grid-panel"),
  gridX: document.getElementById("grid-x"),
  gridY: document.getElementById("grid-y"),
  gridCw: document.getElementById("grid-cw"),
  gridCols: document.getElementById("grid-cols"),
  gridRows: document.getElementById("grid-rows"),
  gridApplyBtn: document.getElementById("grid-apply-btn"),
  gridResetBtn: document.getElementById("grid-reset-btn"),
  statTabMoney: document.getElementById("stat-tab-money"),
  statTabCounts: document.getElementById("stat-tab-counts"),
  statAllMoney: document.getElementById("stat-all-money"),
  statAllTabs: document.getElementById("stat-all-tabs"),
  readyCount: document.getElementById("ready-count"),
  readyList: document.getElementById("ready-list"),
  almostCount: document.getElementById("almost-count"),
  almostList: document.getElementById("almost-list"),
  sellChecklist: document.getElementById("sell-checklist"),
  tooltip: document.getElementById("item-tooltip"),
  dropOverlay: document.getElementById("global-drop-overlay"),
  fixPanel: document.getElementById("fix-panel"),
  fixCloseBtn: document.getElementById("fix-close-btn"),
  fixTopList: document.getElementById("fix-top-list"),
  fixSearchInput: document.getElementById("fix-search-input"),
  fixSearchResults: document.getElementById("fix-search-results"),
  fixEmptyBtn: document.getElementById("fix-empty-btn"),
};

function t() {
  return I18N[state.lang] || I18N.en;
}

function itemName(it) {
  if (!it) return "—";
  return state.lang === "de" ? (it.de || it.en) : it.en;
}

function getActiveTab() {
  return state.tabs.find((x) => x.id === state.activeTabId) || null;
}

// Compute set of all owned itemIds across all scanned tabs
function getOwnedItemCounts() {
  const counts = new Map();
  for (const tab of state.tabs) {
    if (!tab.scan) continue;
    for (const sl of tab.scan.slots) {
      if (!sl.item) continue;
      counts.set(sl.item.id, (counts.get(sl.item.id) || 0) + 1);
    }
  }
  return counts;
}

// Apply translations across static DOM
function applyLanguage() {
  const dict = t();
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
  els.fixSearchInput.placeholder = dict.fixSearchPh;
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === state.lang);
  });
  if (scanner.ready) {
    els.dbStatus.textContent = `${dict.dbReady} · ${scanner.db.items.length}`;
  }
  renderAll();
}

// Render annotated canvas (either live viewport or high-res export with legend bar)
function renderCanvas(tab, targetCanvas, includeLegend = false) {
  if (!tab || !tab.img || !tab.scan) return;
  const dict = t();
  const { img, scan } = tab;
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const legH = includeLegend ? 34 : 0;

  targetCanvas.width = W;
  targetCanvas.height = H + legH;
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  if (includeLegend) {
    ctx.fillStyle = "#181614";
    ctx.fillRect(0, 0, W, legH);
    ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = "middle";
    let lx = 10;
    const items = [
      ["#2ed46a", dict.legendSell],
      ["#ea5449", dict.legendKeep],
      ["#e6b134", dict.legendUtil],
    ];
    for (const [col, label] of items) {
      ctx.fillStyle = col;
      ctx.fillRect(lx, 10, 12, 14);
      ctx.fillStyle = "#f2ede4";
      ctx.fillText(label, lx + 17, 17);
      lx += ctx.measureText(label).width + 30;
    }
  }

  ctx.drawImage(img, 0, legH, W, H);

  for (const sl of scan.slots) {
    const ev = evaluateItem(sl.item, state.enabledTiers, dict, state.lang);
    const x0 = sl.px0;
    const y0 = sl.py0 + legH;
    const bw = Math.max(4, sl.px1 - sl.px0);
    const bh = Math.max(4, sl.py1 - sl.py0);

    const isHover = !includeLegend && state.hoveredSlotId === sl.slotId;
    const isSel = !includeLegend && state.selectedSlotId === sl.slotId;

    let fill, stroke, badgeBg, textCol, lineW;
    if (ev.status === "SELL") {
      fill = isHover ? "rgba(46, 212, 106, 0.30)" : "rgba(46, 212, 106, 0.19)";
      stroke = "#2ef073";
      badgeBg = "rgba(18, 138, 52, 0.94)";
      textCol = "#ffffff";
      lineW = isHover || isSel ? 3.5 : 2.5;
    } else if (ev.status === "KEEP") {
      fill = isHover ? "rgba(234, 84, 73, 0.24)" : "rgba(234, 84, 73, 0.10)";
      stroke = "rgba(238, 72, 65, 0.85)";
      badgeBg = "rgba(168, 30, 28, 0.90)";
      textCol = "#ffe8e6";
      lineW = isHover || isSel ? 3 : 1.75;
    } else {
      fill = isHover ? "rgba(230, 177, 52, 0.26)" : "rgba(230, 177, 52, 0.13)";
      stroke = "rgba(238, 190, 56, 0.90)";
      badgeBg = "rgba(165, 118, 14, 0.92)";
      textCol = "#ffffff";
      lineW = isHover || isSel ? 3 : 2;
    }

    ctx.fillStyle = fill;
    ctx.fillRect(x0, y0, bw, bh);

    ctx.strokeStyle = isSel ? "#ffffff" : stroke;
    ctx.lineWidth = lineW;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);

    // Draw badge pill
    const showBadge = ev.status !== "KEEP" || state.showKeepBadges || isHover || isSel;
    if (showBadge) {
      const lowConf = !sl.manual && sl.score < 0.50;
      const badgeTxt = lowConf ? `${ev.badge}?` : ev.badge;
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(badgeTxt).width;
      const pw = Math.min(bw - 4, tw + 8);
      const ph = 15;
      ctx.fillStyle = badgeBg;
      ctx.fillRect(x0 + 2, y0 + 2, pw, ph);
      ctx.fillStyle = textCol;
      ctx.textBaseline = "middle";
      ctx.fillText(badgeTxt, x0 + 6, y0 + 9.5, bw - 8);
    }
  }
}

function renderTabs() {
  const dict = t();
  els.tabsList.innerHTML = "";
  for (const tab of state.tabs) {
    const sellCnt = tab.scan
      ? tab.scan.slots.filter((sl) => evaluateItem(sl.item, state.enabledTiers, dict, state.lang).status === "SELL").length
      : 0;
    const btn = document.createElement("button");
    btn.className = `tab-btn${tab.id === state.activeTabId ? " active" : ""}`;
    btn.innerHTML = `
      <span>${escapeHtml(tab.name)}</span>
      <span class="tab-sell-chip">${sellCnt} ${dict.badgeSell}</span>
      <span class="tab-close" data-close="${tab.id}" title="Remove">×</span>
    `;
    btn.addEventListener("click", (e) => {
      if (e.target.dataset.close) {
        removeTab(Number(e.target.dataset.close));
        return;
      }
      state.activeTabId = tab.id;
      state.selectedSlotId = null;
      state.hoveredSlotId = null;
      hideTooltip();
      syncGridInputs();
      renderAll();
    });
    els.tabsList.appendChild(btn);
  }
}

function renderLedger() {
  const dict = t();
  const activeTab = getActiveTab();
  let tabSellVal = 0, tabSellSlots = 0, tabKeepSlots = 0;
  let allSellVal = 0;

  for (const tab of state.tabs) {
    if (!tab.scan) continue;
    for (const sl of tab.scan.slots) {
      const ev = evaluateItem(sl.item, state.enabledTiers, dict, state.lang);
      const p = sl.item?.sell || 0;
      if (ev.status === "SELL") {
        allSellVal += p;
        if (tab === activeTab) {
          tabSellVal += p;
          tabSellSlots++;
        }
      } else if (tab === activeTab && ev.status === "KEEP") {
        tabKeepSlots++;
      }
    }
  }

  els.statTabMoney.textContent = formatMoney(tabSellVal, state.lang);
  els.statTabCounts.textContent = `${tabSellSlots} ${dict.summarySellStacks} · ${tabKeepSlots} ${dict.summaryKeepStacks}`;
  els.statAllMoney.textContent = formatMoney(allSellVal, state.lang);
  els.statAllTabs.textContent = `${state.tabs.length} ${dict.summaryTotalTabs}`;

  // Cross-storage Collection Tracker
  if (!scanner.ready || state.tabs.length === 0) {
    els.readyCount.textContent = "0";
    els.almostCount.textContent = "0";
    els.readyList.innerHTML = `<div class="empty-note">${dict.noCollectionsYet}</div>`;
    els.almostList.innerHTML = "";
    els.sellChecklist.innerHTML = `<div class="empty-note">${dict.sellListEmpty}</div>`;
    return;
  }

  const owned = getOwnedItemCounts();
  const ready = [];
  const almost = [];

  for (const rec of scanner.db.recipes) {
    if (!state.enabledTiers[rec.group]) continue;
    let missing = [];
    let haveCount = 0;
    for (const ing of rec.ingredients) {
      const has = (owned.get(ing.itemId) || 0) > 0;
      if (has) haveCount++;
      else missing.push(ing);
    }
    if (missing.length === 0) {
      ready.push({ rec, missing });
    } else if (missing.length === 1 && haveCount >= 2) {
      almost.push({ rec, missing });
    }
  }

  // Sort by highest reward first
  ready.sort((a, b) => b.rec.reward - a.rec.reward);
  almost.sort((a, b) => b.rec.reward - a.rec.reward);

  els.readyCount.textContent = String(ready.length);
  els.almostCount.textContent = String(almost.length);

  els.readyList.innerHTML = ready.length
    ? ready.map(({ rec }) => renderRecipeCard(rec, owned, true)).join("")
    : `<div class="empty-note">${dict.noneReady}</div>`;

  els.almostList.innerHTML = almost.length
    ? almost.map(({ rec }) => renderRecipeCard(rec, owned, false)).join("")
    : `<div class="empty-note">${dict.noneAlmost}</div>`;

  // Safe-to-Sell grouped checklist
  const sellTabs = state.sellScope === "all" ? state.tabs : (activeTab ? [activeTab] : []);
  const grouped = new Map();
  for (const tab of sellTabs) {
    if (!tab.scan) continue;
    for (const sl of tab.scan.slots) {
      if (!sl.item) continue;
      const ev = evaluateItem(sl.item, state.enabledTiers, dict, state.lang);
      if (ev.status !== "SELL") continue;
      const cur = grouped.get(sl.item.id) || { item: sl.item, slots: 0 };
      cur.slots++;
      grouped.set(sl.item.id, cur);
    }
  }
  const sellArr = Array.from(grouped.values()).sort((a, b) => (b.item.sell * b.slots) - (a.item.sell * a.slots));
  els.sellChecklist.innerHTML = sellArr.length
    ? sellArr.map(({ item, slots }) => `
      <div class="sell-item-row">
        <img src="./icons/${item.icon}" alt="" loading="lazy" />
        <div>
          <div class="sell-item-name">${escapeHtml(itemName(item))}${slots > 1 ? ` <span class="sell-item-meta">(${slots}×)</span>` : ""}</div>
          <div class="sell-item-meta rar-${item.rarity}">${dict.rarities[item.rarity] || item.rarity} · ${dict.types[item.type] || item.type}</div>
        </div>
        <div class="sell-item-price">${formatMoney(item.sell, state.lang)}</div>
      </div>
    `).join("")
    : `<div class="empty-note">${dict.sellListEmpty}</div>`;
}

function renderRecipeCard(rec, owned, isReady) {
  const ingsHtml = rec.ingredients.map((ing) => {
    const it = scanner.itemsById.get(ing.itemId);
    const has = (owned.get(ing.itemId) || 0) > 0;
    const qty = ing.quantity > 1 ? `${ing.quantity}× ` : "";
    return `
      <span class="ing-pill ${has ? "have" : "miss"}">
        ${it ? `<img src="./icons/${it.icon}" alt="" />` : ""}
        <span>${has ? "✓" : "○"} ${qty}${escapeHtml(itemName(it))}</span>
      </span>
    `;
  }).join("");
  return `
    <div class="col-row ${isReady ? "ready-row" : ""}">
      <div class="col-row-top">
        <span class="col-title">${escapeHtml(formatColFull(rec.slug, state.lang))}</span>
        <span class="col-reward">${formatMoney(rec.reward, state.lang)}</span>
      </div>
      <div class="col-ings">${ingsHtml}</div>
    </div>
  `;
}

function renderFixPanel() {
  const tab = getActiveTab();
  if (!tab || state.selectedSlotId == null) {
    els.fixPanel.classList.add("hidden");
    return;
  }
  const slot = tab.scan.slots.find((s) => s.slotId === state.selectedSlotId);
  if (!slot) {
    els.fixPanel.classList.add("hidden");
    return;
  }
  els.fixPanel.classList.remove("hidden");

  // Top visual matches
  els.fixTopList.innerHTML = "";
  for (const cand of (slot.top5 || [])) {
    const it = cand.item;
    const pct = Math.max(0, Math.min(99, Math.round(cand.score * 82)));
    const btn = document.createElement("button");
    btn.className = `fix-option${slot.item?.id === it.id ? " selected" : ""}`;
    btn.innerHTML = `
      <img src="./icons/${it.icon}" alt="" />
      <span>${escapeHtml(itemName(it))} <span class="rar-${it.rarity}">(${t().rarities[it.rarity]})</span></span>
      <span class="fix-score">${pct}%</span>
    `;
    btn.addEventListener("click", () => applySlotOverride(slot, it));
    els.fixTopList.appendChild(btn);
  }
  renderFixSearchResults(slot);
}

function renderFixSearchResults(slot) {
  const q = els.fixSearchInput.value.trim().toLowerCase();
  els.fixSearchResults.innerHTML = "";
  if (!q || !scanner.ready) return;
  const matches = scanner.db.items
    .filter((it) => it.en.toLowerCase().includes(q) || (it.de && it.de.toLowerCase().includes(q)))
    .slice(0, 12);
  for (const it of matches) {
    const btn = document.createElement("button");
    btn.className = `fix-option${slot.item?.id === it.id ? " selected" : ""}`;
    btn.innerHTML = `
      <img src="./icons/${it.icon}" alt="" />
      <span>${escapeHtml(itemName(it))} <span class="rar-${it.rarity}">(${t().rarities[it.rarity]})</span></span>
      <span class="fix-score">${it.w}×${it.h}</span>
    `;
    btn.addEventListener("click", () => applySlotOverride(slot, it));
    els.fixSearchResults.appendChild(btn);
  }
}

function applySlotOverride(slot, item) {
  slot.item = item;
  slot.manual = true;
  slot.score = 1.0;
  els.fixSearchInput.value = "";
  renderAll();
}

function renderAll() {
  const hasTabs = state.tabs.length > 0;
  els.emptyState.classList.toggle("hidden", hasTabs);
  els.scannerView.classList.toggle("hidden", !hasTabs);
  renderTabs();
  const active = getActiveTab();
  if (active) renderCanvas(active, els.canvas, false);
  renderLedger();
  renderFixPanel();
}

function syncGridInputs() {
  const tab = getActiveTab();
  if (!tab || !tab.scan) return;
  const g = tab.scan.grid;
  els.gridX.value = Math.round(g.x0);
  els.gridY.value = Math.round(g.y0);
  els.gridCw.value = Number(g.cw.toFixed(1));
  els.gridCols.value = g.ncols;
  els.gridRows.value = g.nrows;
}

// Tooltip Rendering & Positioning
function showTooltip(slot, clientX, clientY) {
  if (!slot || !slot.item) {
    hideTooltip();
    return;
  }
  const dict = t();
  const it = slot.item;
  const ev = evaluateItem(it, state.enabledTiers, dict, state.lang);
  const owned = getOwnedItemCounts();
  const confPct = slot.manual ? 100 : Math.max(0, Math.min(99, Math.round(slot.score * 82)));

  let extraNotes = "";
  if (it.role === "filling") {
    extraNotes += `<div class="tip-note warn">${dict.tipFillingNote}</div>`;
  } else if (it.role === "casino") {
    extraNotes += `<div class="tip-note warn">${dict.tipCasinoNote}</div>`;
  } else if (it.role === "tool") {
    extraNotes += `<div class="tip-note">${dict.tipToolNote}</div>`;
  } else if (it.role === "key") {
    extraNotes += `<div class="tip-note">${dict.tipKeyNote}</div>`;
  } else if (it.role === "raid") {
    extraNotes += `<div class="tip-note">${dict.tipRaidNote}</div>`;
  } else if (ev.status === "SELL" && ev.disabledCols.length > 0) {
    extraNotes += `<div class="tip-note warn">${dict.tipDisabledTier}</div>`;
  } else if (ev.status === "SELL") {
    extraNotes += `<div class="tip-note">${dict.tipSellNote}</div>`;
  }

  if (it.barter) {
    extraNotes += `<div class="tip-note warn"><strong>${dict.tipBarter}:</strong> ${escapeHtml(it.barter[state.lang] || it.barter.en)}</div>`;
  }

  let recipesHtml = "";
  if (it.cols && it.cols.length > 0) {
    const cards = it.cols.map((c) => {
      const rec = scanner.db.recipes.find((r) => r.slug === c.slug);
      if (!rec) return "";
      const ings = rec.ingredients.map((ing) => {
        const ingItem = scanner.itemsById.get(ing.itemId);
        const has = (owned.get(ing.itemId) || 0) > 0;
        const qty = ing.quantity > 1 ? `${ing.quantity}× ` : "";
        return `<div class="${has ? "tip-ing-ok" : "tip-ing-miss"}">${has ? "✓" : "○"} ${qty}${escapeHtml(itemName(ingItem))}</div>`;
      }).join("");
      return `
        <div class="tip-recipe-box">
          <div class="tip-recipe-head">
            <span>${escapeHtml(formatColFull(rec.slug, state.lang))}</span>
            <span style="color:var(--sell)">${formatMoney(rec.reward, state.lang)}</span>
          </div>
          <div class="tip-recipe-ings">${ings}</div>
        </div>
      `;
    }).join("");
    recipesHtml = `<div class="tip-recipes">${cards}</div>`;
  }

  const lowWarn = !slot.manual && slot.score < 0.50
    ? `<div class="tip-note warn">${dict.tipLowConf}</div>`
    : "";

  els.tooltip.innerHTML = `
    <div class="tip-header">
      <img class="tip-icon" src="./icons/${it.icon}" alt="" />
      <div class="tip-title-wrap">
        <div class="tip-name">${escapeHtml(itemName(it))}</div>
        <div class="tip-sub">
          <span class="rar-tag rar-${it.rarity}">${dict.rarities[it.rarity] || it.rarity}</span>
          <span>·</span>
          <span>${dict.types[it.type] || it.type}</span>
          <span>·</span>
          <span>${it.w}×${it.h}</span>
        </div>
      </div>
    </div>
    <div class="tip-verdict ${ev.status}">${ev.verdict}</div>
    <div class="tip-prices">
      <span>${dict.tipFence}: <strong>${formatMoney(it.sell, state.lang)}</strong></span>
      ${it.fullSell ? `<span>${dict.tipFullSell}: <strong style="color:var(--util)">${formatMoney(it.fullSell, state.lang)}</strong></span>` : ""}
    </div>
    ${extraNotes}
    ${recipesHtml}
    ${lowWarn}
    <div class="tip-footer">
      <span>${dict.tipConfidence}: ${confPct}%</span>
      <span>${dict.tipClickFix}</span>
    </div>
  `;

  els.tooltip.classList.remove("hidden");
  positionTooltip(clientX, clientY);
}

function positionTooltip(clientX, clientY) {
  const pad = 16;
  const rect = els.tooltip.getBoundingClientRect();
  let x = clientX + pad;
  let y = clientY + pad;
  if (x + rect.width > window.innerWidth - 10) {
    x = Math.max(10, clientX - rect.width - pad);
  }
  if (y + rect.height > window.innerHeight - 10) {
    y = Math.max(10, window.innerHeight - rect.height - 10);
  }
  els.tooltip.style.left = `${x}px`;
  els.tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  els.tooltip.classList.add("hidden");
}

// Hit-test canvas coordinates -> slot
function slotAtPointer(e) {
  const tab = getActiveTab();
  if (!tab || !tab.scan) return null;
  const rect = els.canvas.getBoundingClientRect();
  const scaleX = els.canvas.width / rect.width;
  const scaleY = els.canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  for (const sl of tab.scan.slots) {
    if (x >= sl.px0 && x <= sl.px1 && y >= sl.py0 && y <= sl.py1) {
      return sl;
    }
  }
  return null;
}

// Load image files (supports PNG, JPG, WEBP, GIF, BMP, AVIF, clipboard blobs)
async function handleFiles(fileList) {
  if (!scanner.ready) return;
  const files = Array.from(fileList).filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(f.name || ""));
  if (files.length === 0) return;

  els.scanSpinner.classList.remove("hidden");
  for (const file of files) {
    try {
      const img = await loadImageFromBlob(file);
      const id = Date.now() + Math.random();
      const num = state.nextTabNum++;
      const cleanName = file.name && !/^image\.png$/i.test(file.name)
        ? file.name.replace(/\.[^.]+$/, "").slice(0, 22)
        : `${t().tabPrefix} #${num}`;
      const scan = scanner.scan(img);
      state.tabs.push({ id, name: cleanName, img, scan, gridOverride: null });
      state.activeTabId = id;
      state.selectedSlotId = null;
    } catch (err) {
      console.error("Failed to scan image:", err);
    }
  }
  els.scanSpinner.classList.add("hidden");
  syncGridInputs();
  renderAll();
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function removeTab(id) {
  state.tabs = state.tabs.filter((x) => x.id !== id);
  if (state.activeTabId === id) {
    state.activeTabId = state.tabs[state.tabs.length - 1]?.id ?? null;
    state.selectedSlotId = null;
  }
  syncGridInputs();
  renderAll();
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// Event Wiring
function wireEvents() {
  // Language toggle
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      localStorage.setItem("rr_lang", state.lang);
      applyLanguage();
    });
  });

  // Collection Tier toggles
  document.querySelectorAll(".tier-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tier = btn.dataset.tier;
      state.enabledTiers[tier] = !state.enabledTiers[tier];
      btn.classList.toggle("active", state.enabledTiers[tier]);
      renderAll();
    });
  });

  // Sell checklist scope toggle
  document.querySelectorAll(".scope-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sellScope = btn.dataset.scope;
      document.querySelectorAll(".scope-btn").forEach((b) => b.classList.toggle("active", b === btn));
      renderLedger();
    });
  });

  // File pickers
  els.browseBtn.addEventListener("click", () => els.fileInput.click());
  els.addMoreBtn.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    els.fileInput.value = "";
  });

  els.clearAllBtn.addEventListener("click", () => {
    state.tabs = [];
    state.activeTabId = null;
    state.selectedSlotId = null;
    state.hoveredSlotId = null;
    hideTooltip();
    renderAll();
  });

  // Global Ctrl+V Paste
  window.addEventListener("paste", (e) => {
    if (document.activeElement === els.fixSearchInput) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  });

  // Global Drag & Drop
  let dragDepth = 0;
  window.addEventListener("dragenter", (e) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      dragDepth++;
      els.dropOverlay.classList.remove("hidden");
    }
  });
  window.addEventListener("dragleave", () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) els.dropOverlay.classList.add("hidden");
  });
  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    dragDepth = 0;
    els.dropOverlay.classList.add("hidden");
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // Canvas hover & click
  els.canvas.addEventListener("mousemove", (e) => {
    const sl = slotAtPointer(e);
    const nextId = sl ? sl.slotId : null;
    if (nextId !== state.hoveredSlotId) {
      state.hoveredSlotId = nextId;
      const active = getActiveTab();
      if (active) renderCanvas(active, els.canvas, false);
    }
    if (sl) showTooltip(sl, e.clientX, e.clientY);
    else hideTooltip();
  });

  els.canvas.addEventListener("mouseleave", () => {
    state.hoveredSlotId = null;
    hideTooltip();
    const active = getActiveTab();
    if (active) renderCanvas(active, els.canvas, false);
  });

  els.canvas.addEventListener("click", (e) => {
    const sl = slotAtPointer(e);
    state.selectedSlotId = sl ? sl.slotId : null;
    els.fixSearchInput.value = "";
    renderAll();
  });

  // Fix Panel
  els.fixCloseBtn.addEventListener("click", () => {
    state.selectedSlotId = null;
    renderAll();
  });
  els.fixSearchInput.addEventListener("input", () => {
    const tab = getActiveTab();
    const slot = tab?.scan?.slots.find((s) => s.slotId === state.selectedSlotId);
    if (slot) renderFixSearchResults(slot);
  });
  els.fixEmptyBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab || state.selectedSlotId == null) return;
    tab.scan.slots = tab.scan.slots.filter((s) => s.slotId !== state.selectedSlotId);
    state.selectedSlotId = null;
    renderAll();
  });

  // Toggle keep badges
  els.toggleKeep.addEventListener("change", () => {
    state.showKeepBadges = els.toggleKeep.checked;
    const active = getActiveTab();
    if (active) renderCanvas(active, els.canvas, false);
  });

  // Grid Adjust panel
  els.gridAdjustBtn.addEventListener("click", () => {
    els.gridPanel.classList.toggle("hidden");
    syncGridInputs();
  });
  els.gridApplyBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab) return;
    const override = {
      x0: Number(els.gridX.value),
      y0: Number(els.gridY.value),
      cw: Number(els.gridCw.value),
      ch: Number(els.gridCw.value),
      ncols: Number(els.gridCols.value),
      nrows: Number(els.gridRows.value),
    };
    tab.gridOverride = override;
    tab.scan = scanner.scan(tab.img, override);
    state.selectedSlotId = null;
    renderAll();
  });
  els.gridResetBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab) return;
    tab.gridOverride = null;
    tab.scan = scanner.scan(tab.img, null);
    state.selectedSlotId = null;
    syncGridInputs();
    renderAll();
  });

  // Export PNG & Copy Image
  els.downloadBtn.addEventListener("click", () => {
    const tab = getActiveTab();
    if (!tab) return;
    const off = document.createElement("canvas");
    renderCanvas(tab, off, true);
    const a = document.createElement("a");
    a.download = `${tab.name.replace(/\s+/g, "_")}_marked.png`;
    a.href = off.toDataURL("image/png");
    a.click();
  });

  els.copyBtn.addEventListener("click", async () => {
    const tab = getActiveTab();
    if (!tab) return;
    const off = document.createElement("canvas");
    renderCanvas(tab, off, true);
    try {
      const blob = await new Promise((res) => off.toBlob(res, "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      const old = els.copyBtn.textContent;
      els.copyBtn.textContent = t().copied;
      setTimeout(() => { els.copyBtn.textContent = t().copyPng; }, 1400);
    } catch {
      const old = els.copyBtn.textContent;
      els.copyBtn.textContent = t().exportError;
      setTimeout(() => { els.copyBtn.textContent = t().copyPng; }, 2200);
    }
  });
}

// Boot
async function boot() {
  wireEvents();
  applyLanguage();
  try {
    await scanner.init(".");
    els.dbStatus.classList.remove("loading");
    els.dbStatus.classList.add("ready");
    applyLanguage();
  } catch (err) {
    console.error(err);
    els.dbStatus.classList.remove("loading");
    els.dbStatus.classList.add("error");
    els.dbStatus.textContent = "DB Error (serve via HTTP/GitHub Pages)";
  }
}

boot();
