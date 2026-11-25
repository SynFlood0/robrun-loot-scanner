import { I18N, formatMoney, formatColFull } from "./i18n.js?v=20261125c";
import { RobRunScanner, evaluateItem } from "./scanner.js?v=20261125c";
import { VehicleWorkbench } from "./vehicles.js?v=20261125c";

const scanner = new RobRunScanner();

function loadSavedTiers() {
  const def = { Basic: true, Additional: true, Special: true, Unique: true };
  try {
    const raw = localStorage.getItem("rr_tiers");
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    return {
      Basic: parsed.Basic !== false,
      Additional: parsed.Additional !== false,
      Special: parsed.Special !== false,
      Unique: parsed.Unique !== false,
    };
  } catch {
    return def;
  }
}

const state = {
  view: "scanner", // "scanner" | "database"
  lang: localStorage.getItem("rr_lang") || (navigator.language?.toLowerCase().startsWith("de") ? "de" : "en"),
  enabledTiers: loadSavedTiers(),
  onlySell: false,
  sellScope: "tab", // "tab" | "all"
  tabs: [], // { id, num, customName, origFilename, img, scan, gridOverride }
  activeTabId: null,
  hoveredSlotId: null,
  selectedSlotId: null,
  nextTabNum: 1,
  clearConfirmTimer: null,
  dbCat: "all",
  dbRar: "all",
  dbSort: "price-desc",
  dbQuery: "",
  dbSelectedId: null,
  dbTiersOpen: false,
};

const els = {
  viewScanner: document.getElementById("view-scanner"),
  viewDatabase: document.getElementById("view-database"),
  viewVehicles: document.getElementById("view-vehicles"),
  dbSearchInput: document.getElementById("db-search-input"),
  dbSortSelect: document.getElementById("db-sort-select"),
  dbCountBar: document.getElementById("db-count-bar"),
  dbTiersSummary: document.getElementById("db-tiers-summary"),
  dbTiersToggleBtn: document.getElementById("db-tiers-toggle-btn"),
  dbTiersDrawer: document.getElementById("db-tiers-drawer"),
  dbItemsGrid: document.getElementById("db-items-grid"),
  dbDetailCard: document.getElementById("db-detail-card"),
  dbStatus: document.getElementById("db-status"),
  fileInput: document.getElementById("file-input"),
  browseBtn: document.getElementById("browse-btn"),
  addMoreBtn: document.getElementById("add-more-btn"),
  clearAllBtn: document.getElementById("clear-all-btn"),
  emptyState: document.getElementById("empty-state"),
  scannerView: document.getElementById("scanner-view"),
  ledgerEmptyGuide: document.getElementById("ledger-empty-guide"),
  ledgerActive: document.getElementById("ledger-active"),
  tabsList: document.getElementById("tabs-list"),
  canvas: document.getElementById("overlay-canvas"),
  scanSpinner: document.getElementById("scan-spinner"),
  toggleOnlySell: document.getElementById("toggle-only-sell"),
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
  primaryTotalBox: document.getElementById("primary-total-box"),
  secondaryTotalBox: document.getElementById("secondary-total-box"),
  statTabMoney: document.getElementById("stat-tab-money"),
  statTabCounts: document.getElementById("stat-tab-counts"),
  statAllMoney: document.getElementById("stat-all-money"),
  statAllTabs: document.getElementById("stat-all-tabs"),
  readySection: document.getElementById("ready-section"),
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

const vehiclesUI = new VehicleWorkbench(els.viewVehicles, () => state.lang, () => t());

function t() {
  return I18N[state.lang] || I18N.en;
}

function itemName(it) {
  if (!it) return "—";
  return state.lang === "de" ? (it.de || it.en) : it.en;
}

function itemDesc(it) {
  if (!it) return "";
  return state.lang === "de" ? (it.descDe || it.descEn || "") : (it.descEn || it.descDe || "");
}

function itemSources(it) {
  if (!it) return [];
  const raw = state.lang === "de" ? (it.srcDe || []) : (it.srcEn || []);
  return raw.filter((s) => s && !/^(Wird nach dem Füllen zu|When filled, turns into):?$/i.test(s.trim()));
}

function tabDisplayName(tab) {
  return tab.customName || `${t().tabPrefix} #${tab.num}`;
}

function getActiveTab() {
  return state.tabs.find((x) => x.id === state.activeTabId) || null;
}

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

function syncTierControls() {
  document.querySelectorAll('input[type="checkbox"][data-tier]').forEach((cb) => {
    cb.checked = Boolean(state.enabledTiers[cb.dataset.tier]);
  });
  const activeCount = Object.values(state.enabledTiers).filter(Boolean).length;
  const dict = t();
  els.dbTiersSummary.textContent = `${dict.dbTiersPrefix} ${activeCount} ${dict.dbTiersOf}`;
  els.dbTiersToggleBtn.textContent = state.dbTiersOpen ? dict.dbTiersDone : dict.dbTiersEdit;
  els.dbTiersDrawer.classList.toggle("hidden", !state.dbTiersOpen);
}

function flashTotals() {
  for (const box of [els.primaryTotalBox, els.secondaryTotalBox]) {
    box.classList.remove("sum-flash");
    void box.offsetWidth;
    box.classList.add("sum-flash");
  }
}

function switchView(viewName, focusItemId = null) {
  state.view = viewName;
  els.viewScanner.classList.toggle("hidden", viewName !== "scanner");
  els.viewDatabase.classList.toggle("hidden", viewName !== "database");
  els.viewVehicles.classList.toggle("hidden", viewName !== "vehicles");
  document.querySelectorAll(".mode-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === viewName);
  });
  hideTooltip();
  if (viewName === "database") {
    if (focusItemId) state.dbSelectedId = focusItemId;
    renderDatabase();
  } else if (viewName === "vehicles") {
    vehiclesUI.render();
  }
}

function applyLanguage() {
  const dict = t();
  document.documentElement.lang = state.lang;
  if (dict.pageTitle) document.title = dict.pageTitle;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dict[key]) node.textContent = dict[key];
  });
  els.fixSearchInput.placeholder = dict.fixSearchPh;
  els.dbSearchInput.placeholder = dict.dbSearchPh;
  document.querySelectorAll("#db-rar-filters .fpill[data-rar]").forEach((b) => {
    const r = b.dataset.rar;
    if (r !== "all" && dict.rarities[r]) b.textContent = dict.rarities[r];
  });
  document.querySelectorAll(".lang-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.lang === state.lang);
  });
  syncTierControls();
  resetClearConfirm();
  renderAll();
  if (state.view === "database") renderDatabase();
  if (state.view === "vehicles") vehiclesUI.render();
}

// Render annotated canvas (live viewport or export PNG with legend)
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
    for (const [col, label] of [
      ["#2ed46a", dict.legendSell],
      ["#ea5449", dict.legendKeep],
      ["#e6b134", dict.legendUtil],
    ]) {
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

    if (state.onlySell && ev.status !== "SELL" && !isHover && !isSel) {
      // Subtle dim outline only so SELL items pop immediately
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);
      continue;
    }

    let fill, stroke, badgeBg, textCol, lineW;
    if (ev.status === "SELL") {
      fill = isHover ? "rgba(46, 212, 106, 0.34)" : "rgba(46, 212, 106, 0.20)";
      stroke = "#2ef073";
      badgeBg = "rgba(18, 138, 52, 0.95)";
      textCol = "#ffffff";
      lineW = isHover || isSel ? 3 : 2.5;
    } else if (ev.status === "KEEP") {
      fill = isHover ? "rgba(234, 84, 73, 0.28)" : "rgba(234, 84, 73, 0.10)";
      stroke = "rgba(238, 72, 65, 0.85)";
      badgeBg = "rgba(168, 30, 28, 0.90)";
      textCol = "#ffe8e6";
      lineW = isHover || isSel ? 2.5 : 1.75;
    } else {
      fill = isHover ? "rgba(230, 177, 52, 0.30)" : "rgba(230, 177, 52, 0.13)";
      stroke = "rgba(238, 190, 56, 0.90)";
      badgeBg = "rgba(165, 118, 14, 0.92)";
      textCol = "#ffffff";
      lineW = isHover || isSel ? 2.5 : 2;
    }

    ctx.fillStyle = fill;
    ctx.fillRect(x0, y0, bw, bh);

    ctx.strokeStyle = isSel ? "#ffffff" : stroke;
    ctx.lineWidth = lineW;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, bw - 1, bh - 1);

    // Clear crisp white hover/selection halo so clickability is unmistakable
    if (isHover || isSel) {
      ctx.strokeStyle = isSel ? "#ffffff" : "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x0 + 2.5, y0 + 2.5, Math.max(2, bw - 5), Math.max(2, bh - 5));
    }

    // Badge pill
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

function updateGridWarning(tab) {
  const dict = t();
  if (!tab || !tab.scan || tab.scan.slots.length === 0) {
    els.gridAdjustBtn.classList.remove("grid-warn");
    els.gridAdjustBtn.textContent = dict.gridBtn;
    return;
  }
  const lowCnt = tab.scan.slots.filter((s) => !s.manual && s.score < 0.50).length;
  const ratio = lowCnt / tab.scan.slots.length;
  const warn = ratio > 0.20 || lowCnt >= 6;
  els.gridAdjustBtn.classList.toggle("grid-warn", warn);
  els.gridAdjustBtn.textContent = warn ? dict.gridBtnWarn : dict.gridBtn;
}

function renderTabs() {
  const dict = t();
  els.tabsList.innerHTML = "";
  for (const tab of state.tabs) {
    const sellCnt = tab.scan
      ? tab.scan.slots.filter((sl) => evaluateItem(sl.item, state.enabledTiers, dict, state.lang).status === "SELL").length
      : 0;
    const displayName = tabDisplayName(tab);
    const tooltipText = tab.origFilename
      ? `${tab.origFilename} · ${dict.tabRenameHint}`
      : dict.tabRenameHint;

    const btn = document.createElement("button");
    btn.className = `tab-btn${tab.id === state.activeTabId ? " active" : ""}`;
    btn.title = tooltipText;
    btn.innerHTML = `
      <span class="tab-label">${escapeHtml(displayName)}</span>
      <span class="tab-sell-chip">${sellCnt} ${dict.badgeSell}</span>
      <span class="tab-close" data-close="${tab.id}" title="Remove">×</span>
    `;

    // Double-click label to rename inline
    const lbl = btn.querySelector(".tab-label");
    lbl.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const inp = document.createElement("input");
      inp.type = "text";
      inp.className = "tab-rename-input";
      inp.value = displayName;
      inp.maxLength = 24;
      lbl.replaceWith(inp);
      inp.focus();
      inp.select();
      const commit = () => {
        const v = inp.value.trim();
        tab.customName = v || null;
        renderTabs();
      };
      inp.addEventListener("blur", commit);
      inp.addEventListener("keydown", (ke) => {
        if (ke.key === "Enter") inp.blur();
        if (ke.key === "Escape") renderTabs();
      });
    });

    btn.addEventListener("click", (e) => {
      if (e.target.closest(".tab-rename-input")) return;
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
  const hasTabs = state.tabs.length > 0;
  els.ledgerEmptyGuide.classList.toggle("hidden", hasTabs);
  els.ledgerActive.classList.toggle("hidden", !hasTabs);
  if (!hasTabs) return;

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

  if (!scanner.ready) return;

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

  ready.sort((a, b) => b.rec.reward - a.rec.reward);
  almost.sort((a, b) => b.rec.reward - a.rec.reward);

  // Dynamic Ready-to-Pack: smoothly reveal ONLY when >= 1 full crate is ready!
  els.readyCount.textContent = String(ready.length);
  els.readySection.classList.toggle("collapsed", ready.length === 0);
  els.readyList.innerHTML = ready.map(({ rec }) => renderRecipeCard(rec, owned, true)).join("");

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
      <div class="sell-item-row" data-open-item="${item.id}" style="cursor:pointer" title="${escapeHtml(dict.tipClickItemHint)}">
        <img src="./icons/${item.icon}" alt="" loading="lazy" />
        <div>
          <div class="sell-item-name">${escapeHtml(itemName(item))}${slots > 1 ? ` <span class="sell-item-meta">(${slots}×)</span>` : ""}</div>
          <div class="sell-item-meta rar-${item.rarity}">${dict.rarities[item.rarity] || item.rarity} · ${dict.types[item.type] || item.type}</div>
        </div>
        <div class="sell-item-price">${formatMoney(item.sell, state.lang)}</div>
      </div>
    `).join("")
    : `<div class="empty-note">${dict.sellListEmpty}</div>`;

  // 1 Item Away
  els.almostCount.textContent = String(almost.length);
  els.almostList.innerHTML = almost.length
    ? almost.map(({ rec }) => renderRecipeCard(rec, owned, false)).join("")
    : `<div class="empty-note">${dict.noneAlmost}</div>`;
}

function renderRecipeCard(rec, owned, isReady) {
  const ingsHtml = rec.ingredients.map((ing) => {
    const it = scanner.itemsById.get(ing.itemId);
    const has = (owned.get(ing.itemId) || 0) > 0;
    const qty = ing.quantity > 1 ? `${ing.quantity}× ` : "";
    return `
      <span class="ing-pill clickable ${has ? "have" : "miss"}" data-open-item="${ing.itemId}" title="${escapeHtml(t().tipClickItemHint)}">
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
  if (active) {
    renderCanvas(active, els.canvas, false);
    updateGridWarning(active);
  }
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

  const sources = itemSources(it);
  let sourcesHtml = "";
  if (sources.length > 0) {
    const shortChips = sources.filter((s) => s.length < 56);
    const longNotes = sources.filter((s) => s.length >= 56);
    sourcesHtml = `
      <div class="tip-sources">
        <div class="tip-sources-title">${dict.tipSources}</div>
        ${shortChips.length ? `<div class="tip-source-chips">${shortChips.slice(0, 5).map((s) => `<span class="src-chip">${escapeHtml(s)}</span>`).join("")}${shortChips.length > 5 ? `<span class="src-chip">+${shortChips.length - 5}</span>` : ""}</div>` : ""}
        ${longNotes.map((n) => `<div class="src-note">${escapeHtml(n)}</div>`).join("")}
      </div>
    `;
  } else {
    sourcesHtml = `
      <div class="tip-sources">
        <div class="tip-sources-title">${dict.tipSources}</div>
        <div class="src-note">${dict.tipNoSource}</div>
      </div>
    `;
  }

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
          <span>${it.w}×${it.h}${it.stack ? ` · ${dict.tipStack} ${it.stack}` : ""}</span>
        </div>
      </div>
    </div>
    <div class="tip-verdict ${ev.status}">${ev.verdict}</div>
    <div class="tip-prices">
      <span>${dict.tipFence}: <strong>${formatMoney(it.sell, state.lang)}</strong></span>
      ${it.fullSell ? `<span>${dict.tipFullSell}: <strong style="color:var(--util)">${formatMoney(it.fullSell, state.lang)}</strong></span>` : ""}
    </div>
    ${sourcesHtml}
    ${extraNotes}
    ${recipesHtml}
    ${lowWarn}
    <div class="tip-footer">
      <span>${dict.tipConfidence}: ${confPct}%</span>
      <span>${state.lang === "de" ? "Klicken zum Ändern" : "Click to fix"}</span>
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
      const origFilename = file.name && !/^image\.png$/i.test(file.name) ? file.name : "";
      const scan = scanner.scan(img);
      state.tabs.push({ id, num, customName: null, origFilename, img, scan, gridOverride: null });
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
  resetClearConfirm();
  syncGridInputs();
  renderAll();
}

function resetClearConfirm() {
  if (state.clearConfirmTimer) {
    clearTimeout(state.clearConfirmTimer);
    state.clearConfirmTimer = null;
  }
  els.clearAllBtn.classList.remove("btn-confirm-danger");
  els.clearAllBtn.textContent = t().clearAll;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

// ============================================================
// ITEM SEARCH / DATABASE EXPLORER VIEW
// ============================================================
function getFilteredDbItems() {
  if (!scanner.ready) return [];
  const dict = t();
  const q = state.dbQuery.trim().toLowerCase();

  const list = scanner.db.items.filter((it) => {
    if (state.dbRar !== "all" && it.rarity !== state.dbRar) return false;
    const ev = evaluateItem(it, state.enabledTiers, dict, state.lang);
    if (state.dbCat === "sell" && ev.status !== "SELL") return false;
    if (state.dbCat === "col" && (!it.cols || it.cols.length === 0)) return false;
    if (state.dbCat === "special" && it.role !== "filling" && it.role !== "barter" && !it.barter) return false;
    if (state.dbCat === "tools" && !["tool", "key", "raid"].includes(it.role)) return false;

    if (q) {
      const hay = [
        it.en,
        it.de || "",
        dict.types[it.type] || it.type,
        ...(it.srcDe || []),
        ...(it.srcEn || []),
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (state.dbSort === "price-desc") {
    list.sort((a, b) => (b.sell || 0) - (a.sell || 0) || itemName(a).localeCompare(itemName(b)));
  } else if (state.dbSort === "price-asc") {
    list.sort((a, b) => (a.sell || 0) - (b.sell || 0) || itemName(a).localeCompare(itemName(b)));
  } else {
    list.sort((a, b) => itemName(a).localeCompare(itemName(b)));
  }
  return list;
}

function renderDatabase() {
  if (!scanner.ready) return;
  const dict = t();
  const list = getFilteredDbItems();
  els.dbCountBar.textContent = `${list.length} ${dict.dbResultsCount}`;
  syncTierControls();

  if (!state.dbSelectedId && list.length > 0) {
    state.dbSelectedId = list[0].id;
  }

  els.dbItemsGrid.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const it of list) {
    const ev = evaluateItem(it, state.enabledTiers, dict, state.lang);
    const srcs = itemSources(it);
    const firstLoc = srcs[0] || dict.tipNoSource;
    const stateTag = it.state === "Full" ? (state.lang === "de" ? " (Voll)" : " (Full)") : it.state === "Filling" ? (state.lang === "de" ? " (Füllend)" : " (Filling)") : "";

    const btn = document.createElement("button");
    btn.className = `db-item-card${it.id === state.dbSelectedId ? " selected" : ""}`;
    btn.innerHTML = `
      <img class="db-card-icon" src="./icons/${it.icon}" alt="" loading="lazy" />
      <div style="min-width:0">
        <div class="db-card-top">
          <span class="db-card-name">${escapeHtml(itemName(it))}${stateTag}</span>
          <span class="db-badge ${ev.status}">${escapeHtml(ev.badge)}</span>
        </div>
        <div class="db-card-meta">
          <span class="rar-${it.rarity}">${dict.rarities[it.rarity] || it.rarity}</span>
          <span class="db-card-price">${formatMoney(it.sell, state.lang)}</span>
        </div>
        <div class="db-card-loc">${escapeHtml(firstLoc)}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      state.dbSelectedId = it.id;
      document.querySelectorAll(".db-item-card.selected").forEach((el) => el.classList.remove("selected"));
      btn.classList.add("selected");
      renderDbDetail();
    });
    frag.appendChild(btn);
  }
  els.dbItemsGrid.appendChild(frag);
  renderDbDetail();
}

function renderDbDetail() {
  const dict = t();
  const it = state.dbSelectedId ? scanner.itemsById.get(state.dbSelectedId) : null;
  if (!it) {
    els.dbDetailCard.innerHTML = `<div class="empty-note">${dict.dbEmptyDetail}</div>`;
    return;
  }
  const ev = evaluateItem(it, state.enabledTiers, dict, state.lang);
  const desc = itemDesc(it);
  const srcs = itemSources(it);
  const owned = getOwnedItemCounts();
  const slotsCount = Math.max(1, (it.w || 1) * (it.h || 1));
  const perSlot = it.sell ? Math.round(it.sell / slotsCount) : 0;
  const lv5Price = it.sell ? Math.round(it.sell * 1.5) : 0;
  const stateTag = it.state === "Full" ? (state.lang === "de" ? " · Voll" : " · Full") : it.state === "Filling" ? (state.lang === "de" ? " · Füllend" : " · Filling") : "";

  const shortChips = srcs.filter((s) => s.length < 56);
  const longNotes = srcs.filter((s) => s.length >= 56);

  const whereHtml = srcs.length
    ? `
      ${shortChips.length ? `<div class="tip-source-chips">${shortChips.map((s) => `<button type="button" class="src-chip src-chip-btn" data-filter-loc="${escapeHtml(s.split("(")[0].trim())}">${escapeHtml(s)}</button>`).join("")}</div>` : ""}
      ${longNotes.map((n) => `<div class="src-note" style="margin-top:6px">${escapeHtml(n)}</div>`).join("")}
      ${shortChips.length ? `<div class="dossier-hint">${dict.dbClickLocHint}</div>` : ""}
    `
    : `<div class="src-note">${dict.tipNoSource}</div>`;

  let colsHtml = "";
  if (it.cols && it.cols.length > 0) {
    const cards = it.cols.map((c) => {
      const rec = scanner.db.recipes.find((r) => r.slug === c.slug);
      return rec ? renderRecipeCard(rec, owned, false) : "";
    }).join("");
    colsHtml = `
      <div>
        <div class="dossier-sec-title">${dict.tipUsedIn}</div>
        <div class="col-list">${cards}</div>
      </div>
    `;
  }

  let extraHtml = "";
  if (it.barter) {
    extraHtml += `<div class="tip-note warn"><strong>${dict.tipBarter}:</strong> ${escapeHtml(it.barter[state.lang] || it.barter.en)}</div>`;
  }
  if (it.role === "filling") {
    extraHtml += `<div class="tip-note warn">${dict.tipFillingNote}</div>`;
  } else if (it.role === "casino") {
    extraHtml += `<div class="tip-note warn">${dict.tipCasinoNote}</div>`;
  } else if (it.role === "tool") {
    extraHtml += `<div class="tip-note">${dict.tipToolNote}</div>`;
  } else if (it.role === "key") {
    extraHtml += `<div class="tip-note">${dict.tipKeyNote}</div>`;
  } else if (it.role === "raid") {
    extraHtml += `<div class="tip-note">${dict.tipRaidNote}</div>`;
  }

  els.dbDetailCard.innerHTML = `
    <div class="dossier-head">
      <img class="dossier-icon" src="./icons/${it.icon}" alt="" />
      <div>
        <div class="dossier-name">${escapeHtml(itemName(it))}</div>
        <div class="dossier-sub">
          <span class="rar-tag rar-${it.rarity}">${dict.rarities[it.rarity] || it.rarity}</span>
          · ${dict.types[it.type] || it.type} · ${it.w}×${it.h}${it.stack ? ` · ${dict.tipStack} ${it.stack}` : ""}${stateTag}
        </div>
      </div>
    </div>
    ${desc ? `<div class="dossier-quote">„${escapeHtml(desc)}“</div>` : ""}
    <div class="tip-verdict ${ev.status}">${ev.verdict}</div>
    <div class="dossier-stats">
      <div class="dstat">
        <div class="dstat-label">${dict.tipFence}</div>
        <div class="dstat-val" style="color:var(--sell)">${formatMoney(it.sell, state.lang)}</div>
      </div>
      <div class="dstat">
        <div class="dstat-label">${it.fullSell ? dict.tipFullSell : dict.tipFenceMax}</div>
        <div class="dstat-val" style="color:${it.fullSell ? "var(--util)" : "var(--text-primary)"}">${formatMoney(it.fullSell || lv5Price, state.lang)}</div>
      </div>
      <div class="dstat">
        <div class="dstat-label">${dict.tipPerSlot}</div>
        <div class="dstat-val">${formatMoney(perSlot, state.lang)}</div>
      </div>
      <div class="dstat">
        <div class="dstat-label">${dict.tipSize} / ${dict.tipStack}</div>
        <div class="dstat-val">${it.w}×${it.h} · ${it.stack || 1}×</div>
      </div>
    </div>
    <div>
      <div class="dossier-sec-title">${dict.dbWhereTitle}</div>
      ${whereHtml}
    </div>
    ${extraHtml}
    ${colsHtml}
  `;
}

// Event Wiring
function wireEvents() {
  // Top Mode Switcher
  document.querySelectorAll(".mode-tab").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  // Shared Collection Tier Checkboxes (Scanner + Item Search synced + saved in localStorage!)
  document.querySelectorAll('input[type="checkbox"][data-tier]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const tier = cb.dataset.tier;
      state.enabledTiers[tier] = cb.checked;
      localStorage.setItem("rr_tiers", JSON.stringify(state.enabledTiers));
      syncTierControls();
      renderAll();
      if (state.view === "scanner" && state.tabs.length > 0) flashTotals();
      if (state.view === "database") renderDatabase();
    });
  });

  // Item Search inline tier drawer toggle
  els.dbTiersToggleBtn.addEventListener("click", () => {
    state.dbTiersOpen = !state.dbTiersOpen;
    syncTierControls();
  });

  // Click any ingredient pill or sell row -> open in Item Search; click location chip -> filter by location
  document.addEventListener("click", (e) => {
    const ing = e.target.closest("[data-open-item]");
    if (ing) {
      const id = ing.dataset.openItem;
      state.dbQuery = "";
      els.dbSearchInput.value = "";
      state.dbCat = "all";
      state.dbRar = "all";
      document.querySelectorAll("#db-cat-filters .fpill").forEach((b) => b.classList.toggle("active", b.dataset.cat === "all"));
      document.querySelectorAll("#db-rar-filters .fpill").forEach((b) => b.classList.toggle("active", b.dataset.rar === "all"));
      switchView("database", id);
      return;
    }
    const locBtn = e.target.closest("[data-filter-loc]");
    if (locBtn) {
      const loc = locBtn.dataset.filterLoc;
      state.dbQuery = loc;
      els.dbSearchInput.value = loc;
      state.dbCat = "all";
      state.dbRar = "all";
      document.querySelectorAll("#db-cat-filters .fpill").forEach((b) => b.classList.toggle("active", b.dataset.cat === "all"));
      document.querySelectorAll("#db-rar-filters .fpill").forEach((b) => b.classList.toggle("active", b.dataset.rar === "all"));
      renderDatabase();
    }
  });

  // Esc closes Fix Panel, Grid Panel, and Tooltip
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideTooltip();
      if (state.selectedSlotId != null) {
        state.selectedSlotId = null;
        renderAll();
      }
      if (!els.gridPanel.classList.contains("hidden")) {
        els.gridPanel.classList.add("hidden");
      }
    }
  });

  // Item Search filters & sort
  els.dbSearchInput.addEventListener("input", () => {
    state.dbQuery = els.dbSearchInput.value;
    renderDatabase();
  });
  els.dbSortSelect.addEventListener("change", () => {
    state.dbSort = els.dbSortSelect.value;
    renderDatabase();
  });
  document.querySelectorAll("#db-cat-filters .fpill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dbCat = btn.dataset.cat;
      document.querySelectorAll("#db-cat-filters .fpill").forEach((b) => b.classList.toggle("active", b === btn));
      renderDatabase();
    });
  });
  document.querySelectorAll("#db-rar-filters .fpill").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.dbRar = btn.dataset.rar;
      document.querySelectorAll("#db-rar-filters .fpill").forEach((b) => b.classList.toggle("active", b === btn));
      renderDatabase();
    });
  });

  // Language toggle
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.lang = btn.dataset.lang;
      localStorage.setItem("rr_lang", state.lang);
      applyLanguage();
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

  // Clear All with 2-click confirmation when > 1 storage is open
  els.clearAllBtn.addEventListener("click", () => {
    if (state.tabs.length > 1 && !state.clearConfirmTimer) {
      els.clearAllBtn.classList.add("btn-confirm-danger");
      els.clearAllBtn.textContent = t().clearAllConfirm;
      state.clearConfirmTimer = setTimeout(resetClearConfirm, 3200);
      return;
    }
    resetClearConfirm();
    state.tabs = [];
    state.activeTabId = null;
    state.selectedSlotId = null;
    state.hoveredSlotId = null;
    state.nextTabNum = 1;
    hideTooltip();
    renderAll();
  });

  // Global Ctrl+V Paste
  window.addEventListener("paste", (e) => {
    if (document.activeElement === els.fixSearchInput || document.activeElement === els.dbSearchInput) return;
    if (document.activeElement?.classList?.contains("tab-rename-input")) return;
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
      switchView("scanner");
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
      switchView("scanner");
      handleFiles(e.dataTransfer.files);
    }
  });

  // Canvas hover & click (pointer cursor over items!)
  els.canvas.addEventListener("mousemove", (e) => {
    const sl = slotAtPointer(e);
    els.canvas.style.cursor = sl ? "pointer" : "default";
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
    els.canvas.style.cursor = "default";
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

  // Only highlight SELL toggle
  els.toggleOnlySell.addEventListener("change", () => {
    state.onlySell = els.toggleOnlySell.checked;
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
    a.download = `${tabDisplayName(tab).replace(/\s+/g, "_")}_marked.png`;
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
      els.copyBtn.textContent = t().copied;
      setTimeout(() => { els.copyBtn.textContent = t().copyPng; }, 1400);
    } catch {
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
    // Hide status pill cleanly once loaded!
    els.dbStatus.classList.add("hidden");
    applyLanguage();
  } catch (err) {
    console.error(err);
    els.dbStatus.classList.remove("loading", "hidden");
    els.dbStatus.classList.add("error");
    els.dbStatus.textContent = t().dbError;
  }
}

boot();
