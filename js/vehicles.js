// Rob Run Car Tuning & Police Comparison Workbench (Datamined Build 4052)
import { formatMoney } from "./i18n.js?v=20261125c";

export const PART_PRICES = {
  ecu:         { none: 0, uncommon: 14000, epic: 75000,  legendary: 330000 },
  turbo:       { none: 0, epic: 79500,     legendary: 238000 },
  intercooler: { none: 0, epic: 72000,     legendary: 270000 },
  steering:    { none: 0, epic: 68000,     legendary: 270000 },
  brake:       { none: 0, uncommon: 11500, epic: 61500 },
  trunk:       { none: 0, uncommon: 1200,  epic: 70500,  legendary: 270000 },
  cargo:       { none: 0, epic: 86500,     legendary: 350000 },
};

export const VEHICLES = [
  {
    id: "fukurou_spark",
    name: "Fukurou Spark",
    alias: { en: "Motel Rental", de: "Motel-Mietwagen" },
    rarity: "Common",
    tier: 0,
    category: "car",
    upgradeable: false,
    price: 0,
    unlock: 0,
    speed: 76,
    df: 10.2,
    brake: 20.0,
    gears: 4,
    seats: 2,
    trunk: 2,
    trunkSlots: 0,
    cargo: 1,
    cargoSlots: 0,
  },
  {
    id: "longhorn_van",
    name: "Longhorn Van",
    alias: { en: "Cargo Van", de: "Transporter" },
    rarity: "Uncommon",
    tier: 1,
    category: "car",
    upgradeable: true,
    price: 180000,
    unlock: 50000,
    speed: 76,
    df: 10.5,
    brake: 18.0,
    gears: 4,
    seats: 4,
    trunk: 8,
    trunkSlots: 2,
    cargo: 6,
    cargoSlots: 3,
    mods: {
      ecu: { uncommon: 4.7, epic: 6.3, legendary: 9.0 },
      turbo: { epic: 0.37, legendary: 0.73 },
      intercooler: { epic: 0.37, legendary: 0.73 },
      steering: { epic: [0.052, 0.125], legendary: [0.105, 0.25] },
      brake: { uncommon: [0.092, 0.051], epic: [0.185, 0.102] },
    },
  },
  {
    id: "fukurou_tensa",
    name: "Fukurou Tensa",
    alias: { en: "Starter Sedan", de: "Starter-Limousine" },
    rarity: "Uncommon",
    tier: 1,
    category: "car",
    upgradeable: true,
    price: 200000,
    unlock: 50000,
    speed: 84,
    df: 8.2,
    brake: 21.0,
    gears: 3,
    seats: 4,
    trunk: 2,
    trunkSlots: 1,
    cargo: 1,
    cargoSlots: 1,
    mods: {
      ecu: { uncommon: 4.0, epic: 6.1, legendary: 7.9 },
      turbo: { epic: 0.50, legendary: 1.00 },
      intercooler: { epic: 0.50, legendary: 1.00 },
      steering: { epic: [0.052, 0.15], legendary: [0.105, 0.30] },
      brake: { uncommon: [0.092, 0.084], epic: [0.185, 0.168] },
    },
  },
  {
    id: "longhorn_titan",
    name: "Longhorn Titan",
    alias: { en: "Tier II SUV", de: "Tier-II SUV" },
    rarity: "Epic",
    tier: 2,
    category: "car",
    upgradeable: true,
    price: 900000,
    unlock: 250000,
    speed: 88,
    df: 12.4,
    brake: 20.0,
    gears: 5,
    seats: 4,
    trunk: 6,
    trunkSlots: 2,
    cargo: 6,
    cargoSlots: 1,
    mods: {
      ecu: { uncommon: 5.0, epic: 7.4, legendary: 9.9 },
      turbo: { epic: 0.53, legendary: 1.07 },
      intercooler: { epic: 0.53, legendary: 1.07 },
      steering: { epic: [0.052, 0.11], legendary: [0.105, 0.25] },
      brake: { uncommon: [0.092, 0.084], epic: [0.185, 0.168] },
    },
  },
  {
    id: "royal_e",
    name: "Royal E",
    alias: { en: "BMW Sedan", de: "BMW" },
    rarity: "Epic",
    tier: 2,
    category: "car",
    upgradeable: true,
    price: 1000000,
    unlock: 250000,
    speed: 91,
    df: 10.7,
    brake: 25.0,
    gears: 4,
    seats: 4,
    trunk: 3,
    trunkSlots: 1,
    cargo: 2,
    cargoSlots: 1,
    mods: {
      ecu: { uncommon: 5.8, epic: 9.0, legendary: 11.9 },
      turbo: { epic: 0.42, legendary: 0.83 },
      intercooler: { epic: 0.42, legendary: 0.83 },
      steering: { epic: [0.055, 0.11], legendary: [0.11, 0.23] },
      brake: { uncommon: [0.092, 0.10], epic: [0.185, 0.20] },
    },
  },
  {
    id: "royal_j",
    name: "Royal J",
    alias: { en: "Tier III Crossover", de: "Tier-III Crossover" },
    rarity: "Legendary",
    tier: 3,
    category: "car",
    upgradeable: true,
    price: 4000000,
    unlock: 750000,
    speed: 90,
    df: 11.0,
    brake: 24.0,
    gears: 3,
    seats: 4,
    trunk: 6,
    trunkSlots: 3,
    cargo: 4,
    cargoSlots: 2,
    mods: {
      ecu: { uncommon: 5.8, epic: 9.0, legendary: 11.9 },
      turbo: { epic: 0.57, legendary: 1.13 },
      intercooler: { epic: 0.57, legendary: 1.13 },
      steering: { epic: [0.061, 0.13], legendary: [0.122, 0.26] },
      brake: { uncommon: [0.107, 0.09], epic: [0.215, 0.18] },
    },
  },
  {
    id: "longhorn_wild",
    name: "Longhorn Wild",
    alias: { en: "Dodge Muscle", de: "Dodge" },
    rarity: "Legendary",
    tier: 3,
    category: "car",
    upgradeable: true,
    price: 4500000,
    unlock: 750000,
    speed: 106,
    df: 12.0,
    brake: 24.0,
    gears: 3,
    seats: 2,
    trunk: 3,
    trunkSlots: 1,
    cargo: 1,
    cargoSlots: 1,
    mods: {
      ecu: { uncommon: 6.3, epic: 9.4, legendary: 12.6 },
      turbo: { epic: 0.60, legendary: 1.20 },
      intercooler: { epic: 0.60, legendary: 1.20 },
      steering: { epic: [0.064, 0.17], legendary: [0.128, 0.30] },
      brake: { uncommon: [0.12, 0.102], epic: [0.24, 0.205] },
    },
  },
  {
    id: "buletti_soltempra",
    name: "Buletti Soltempra",
    alias: { en: "Exotic Supercar", de: "Exotic / Lambo" },
    rarity: "Exotic",
    tier: 3,
    category: "car",
    upgradeable: true,
    price: 10000000,
    unlock: 2750000,
    speed: 115,
    df: 11.6,
    brake: 28.0,
    gears: 3,
    seats: 2,
    trunk: 2,
    trunkSlots: 1,
    cargo: 0,
    cargoSlots: 0,
    mods: {
      ecu: { uncommon: 6.8, epic: 10.4, legendary: 13.7 },
      turbo: { epic: 0.68, legendary: 1.36 },
      intercooler: { epic: 0.68, legendary: 1.36 },
      steering: { epic: [0.05, 0.11], legendary: [0.10, 0.45] },
      brake: { uncommon: [0.085, 0.082], epic: [0.17, 0.165] },
    },
  },
  {
    id: "police_guard",
    name: "Longhorn Guard",
    alias: { en: "Police Patrol", de: "Polizei-Streife" },
    rarity: "Police",
    tier: 9,
    category: "police",
    upgradeable: false,
    price: 0,
    unlock: 0,
    speed: 101,
    df: 11.2,
    brake: 24.0,
    gears: 4,
    seats: 4,
    trunk: 7,
    trunkSlots: 0,
    cargo: 12,
    cargoSlots: 0,
  },
  {
    id: "police_outrider",
    name: "Longhorn Outrider",
    alias: { en: "Police SUV", de: "Polizei-SUV" },
    rarity: "Police",
    tier: 9,
    category: "police",
    upgradeable: false,
    price: 0,
    unlock: 0,
    speed: 103,
    df: 11.6,
    brake: 23.0,
    gears: 5,
    seats: 4,
    trunk: 7,
    trunkSlots: 0,
    cargo: 12,
    cargoSlots: 0,
  },
  {
    id: "police_wild",
    name: "Longhorn Wild Guard",
    alias: { en: "Police Interceptor", de: "Polizei-Abfangjäger" },
    rarity: "Police",
    tier: 9,
    category: "police",
    upgradeable: false,
    price: 0,
    unlock: 0,
    speed: 115,
    df: 12.0,
    brake: 24.0,
    gears: 3,
    seats: 2,
    trunk: 7,
    trunkSlots: 0,
    cargo: 12,
    cargoSlots: 0,
  },
];

const POLICE_BENCHMARKS = [
  { id: "police_guard", short: "Guard", speed: 101, df: 11.2 },
  { id: "police_outrider", short: "Outrider", speed: 103, df: 11.6 },
  { id: "police_wild", short: "Wild Guard", speed: 115, df: 12.0 },
];

const V_BY_ID = new Map(VEHICLES.map((v) => [v.id, v]));

function presetParts(preset) {
  if (preset === "epic") {
    return { ecu: "epic", turbo: "epic", intercooler: "epic", steering: "epic", brake: "epic", trunk: "epic", cargo: "epic" };
  }
  if (preset === "legendary") {
    return { ecu: "legendary", turbo: "legendary", intercooler: "legendary", steering: "legendary", brake: "epic", trunk: "legendary", cargo: "legendary" };
  }
  return { ecu: "none", turbo: "none", intercooler: "none", steering: "none", brake: "none", trunk: "none", cargo: "none" };
}

export function computeBuild(carId, parts) {
  const car = V_BY_ID.get(carId) || V_BY_ID.get("royal_e");
  const base = {
    car,
    speed: car.speed,
    speedBonus: 0,
    df: car.df,
    dfBonus: 0,
    steerF: 0,
    steerR: 0,
    brakeF: 0,
    brakeR: 0,
    trunk: car.trunk,
    trunkBonus: 0,
    cargo: car.cargo,
    cargoBonus: 0,
    perfCost: 0,
    utilCost: 0,
    partsCost: 0,
  };
  if (!car.upgradeable || !car.mods) return base;

  const p = parts || presetParts("none");
  const ecuB = p.ecu !== "none" ? (car.mods.ecu[p.ecu] || 0) : 0;
  const turboB = p.turbo !== "none" ? (car.mods.turbo[p.turbo] || 0) : 0;
  const icB = p.intercooler !== "none" ? (car.mods.intercooler[p.intercooler] || 0) : 0;
  const stB = p.steering !== "none" ? (car.mods.steering[p.steering] || [0, 0]) : [0, 0];
  const brB = p.brake !== "none" ? (car.mods.brake[p.brake] || [0, 0]) : [0, 0];

  const trunkPer = p.trunk === "uncommon" ? 1 : p.trunk === "epic" ? 2 : p.trunk === "legendary" ? 3 : 0;
  const cargoPer = p.cargo === "epic" ? 1 : p.cargo === "legendary" ? 2 : 0;

  const trunkB = trunkPer * car.trunkSlots;
  const cargoB = cargoPer * car.cargoSlots;

  const perfCost =
    (PART_PRICES.ecu[p.ecu] || 0) +
    (PART_PRICES.turbo[p.turbo] || 0) +
    (PART_PRICES.intercooler[p.intercooler] || 0) +
    (PART_PRICES.steering[p.steering] || 0) +
    (PART_PRICES.brake[p.brake] || 0);

  const utilCost =
    (PART_PRICES.trunk[p.trunk] || 0) * car.trunkSlots +
    (PART_PRICES.cargo[p.cargo] || 0) * car.cargoSlots;

  return {
    car,
    speed: +(car.speed + ecuB).toFixed(1),
    speedBonus: +ecuB.toFixed(1),
    df: +(car.df + turboB + icB).toFixed(2),
    dfBonus: +(turboB + icB).toFixed(2),
    steerF: stB[0],
    steerR: stB[1],
    brakeF: brB[0],
    brakeR: brB[1],
    trunk: car.trunk + trunkB,
    trunkBonus: trunkB,
    cargo: car.cargo + cargoB,
    cargoBonus: cargoB,
    perfCost,
    utilCost,
    partsCost: perfCost + utilCost,
  };
}

function fmtNum(n, lang, decimals = 1) {
  const s = Number(n).toFixed(decimals);
  return lang === "de" ? s.replace(".", ",") : s;
}

function fmtDelta(diff, unit, lang, decimals = 1) {
  if (Math.abs(diff) < 0.005) return `<span class="veh-delta flat">±0</span>`;
  const cls = diff > 0 ? "pos" : "neg";
  const sign = diff > 0 ? "+" : "";
  return `<span class="veh-delta ${cls}">${sign}${fmtNum(diff, lang, decimals)}${unit}</span>`;
}

function carDisplayLabel(car, lang) {
  const alias = car.alias?.[lang] || car.alias?.en || "";
  return alias ? `${car.name} (${alias})` : car.name;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

export class VehicleWorkbench {
  constructor(rootEl, getLang, getDict) {
    this.root = rootEl;
    this.getLang = getLang;
    this.getDict = getDict;
    this.state = {
      slotA: { carId: "royal_e", parts: presetParts("epic") },
      slotB: { carId: "royal_e", parts: presetParts("legendary") },
      fleetPreset: "legendary", // "none" | "epic" | "legendary"
      fleetFilter: "all",       // "all" | "t2plus" | "police" | "4seat"
      fleetSort: "speed",       // "speed" | "df" | "cargo" | "price"
    };
    this._wired = false;
  }

  render() {
    if (!this.root) return;
    const lang = this.getLang();
    const dict = this.getDict();

    const buildA = computeBuild(this.state.slotA.carId, this.state.slotA.parts);
    const buildB = computeBuild(this.state.slotB.carId, this.state.slotB.parts);

    this.root.innerHTML = `
      <div class="veh-wrap">
        <!-- Quick Compare Scenarios -->
        <div class="veh-top-strip">
          <div class="veh-intro">
            <h2>${escapeHtml(dict.vehTitle)}</h2>
            <p>${escapeHtml(dict.vehSubtitle)}</p>
          </div>
          <div class="veh-quick-matchups">
            <span class="veh-qm-label">${escapeHtml(dict.vehPresetsLabel)}</span>
            <button class="fpill" data-matchup="bmw-lila-gold">${escapeHtml(dict.vehPresetBmw)}</button>
            <button class="fpill" data-matchup="bmw-vs-dodge">${escapeHtml(dict.vehPresetBmwDodge)}</button>
            <button class="fpill" data-matchup="dodge-vs-wildguard">${escapeHtml(dict.vehPresetDodgeCop)}</button>
            <button class="fpill" data-matchup="dodge-vs-buletti">${escapeHtml(dict.vehPresetDodgeBul)}</button>
            <button class="fpill" data-matchup="bmw-vs-outrider">${escapeHtml(dict.vehPresetBmwCop)}</button>
          </div>
        </div>

        <!-- Side-by-Side Interactive Tuning Workbench -->
        <div class="veh-compare-grid">
          ${this.renderSlotCard("slotA", "A", buildA, buildB, lang, dict)}
          ${this.renderSlotCard("slotB", "B", buildB, buildA, lang, dict)}
        </div>

        <!-- Full Fleet Ranking (All 11 Cars + Police) -->
        <section class="veh-fleet-panel">
          <div class="veh-fleet-head">
            <div>
              <h3>${escapeHtml(dict.vehFleetTitle)}</h3>
              <p class="veh-fleet-sub">${escapeHtml(dict.vehFleetSub)}</p>
            </div>
            <div class="veh-fleet-controls">
              <div class="veh-ctrl-group">
                <span class="veh-ctrl-lbl">${escapeHtml(dict.vehTuningPreset)}</span>
                <div class="veh-seg">
                  <button class="veh-seg-btn${this.state.fleetPreset === "none" ? " active" : ""}" data-fleet-preset="none">${escapeHtml(dict.vehStock)}</button>
                  <button class="veh-seg-btn rar-btn-epic${this.state.fleetPreset === "epic" ? " active" : ""}" data-fleet-preset="epic">${escapeHtml(dict.vehFullEpic)}</button>
                  <button class="veh-seg-btn rar-btn-leg${this.state.fleetPreset === "legendary" ? " active" : ""}" data-fleet-preset="legendary">${escapeHtml(dict.vehFullLeg)}</button>
                </div>
              </div>
              <div class="veh-ctrl-group">
                <span class="veh-ctrl-lbl">${escapeHtml(dict.vehFilter)}</span>
                <div class="filter-pills">
                  <button class="fpill${this.state.fleetFilter === "all" ? " active" : ""}" data-fleet-filter="all">${escapeHtml(dict.dbFilterAll)}</button>
                  <button class="fpill${this.state.fleetFilter === "t2plus" ? " active" : ""}" data-fleet-filter="t2plus">${escapeHtml(dict.vehFilterT2)}</button>
                  <button class="fpill${this.state.fleetFilter === "police" ? " active" : ""}" data-fleet-filter="police">${escapeHtml(dict.vehFilterPolice)}</button>
                  <button class="fpill${this.state.fleetFilter === "4seat" ? " active" : ""}" data-fleet-filter="4seat">${escapeHtml(dict.vehFilter4Seat)}</button>
                </div>
              </div>
              <div class="veh-ctrl-group">
                <span class="veh-ctrl-lbl">${escapeHtml(dict.vehSort)}</span>
                <select class="veh-select-sm" id="veh-fleet-sort">
                  <option value="speed"${this.state.fleetSort === "speed" ? " selected" : ""}>${escapeHtml(dict.vehSortSpeed)}</option>
                  <option value="df"${this.state.fleetSort === "df" ? " selected" : ""}>${escapeHtml(dict.vehSortDf)}</option>
                  <option value="cargo"${this.state.fleetSort === "cargo" ? " selected" : ""}>${escapeHtml(dict.vehSortCargo)}</option>
                  <option value="price"${this.state.fleetSort === "price" ? " selected" : ""}>${escapeHtml(dict.vehSortPrice)}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="veh-fleet-table-hdr">
            <span>${escapeHtml(dict.vehColCar)}</span>
            <span>${escapeHtml(dict.vehColSpeed)}</span>
            <span>${escapeHtml(dict.vehColAccel)}</span>
            <span>${escapeHtml(dict.vehColSpace)}</span>
            <span>${escapeHtml(dict.vehColCompare)}</span>
          </div>

          <div class="veh-fleet-rows">
            ${this.renderFleetRows(lang, dict)}
          </div>

          <div class="veh-fleet-footer">
            <span><strong>${escapeHtml(dict.vehRuleTitle)}:</strong> ${escapeHtml(dict.vehRuleText)}</span>
            <span><strong>Romanov R8 (${lang === "de" ? "Heli" : "Heli"}):</strong> ${formatMoney(10000000, lang)} · 4 ${escapeHtml(dict.vehSeats)} · 35 m/s · 210 m</span>
          </div>
        </section>
      </div>
    `;

    if (!this._wired) {
      this._wireEvents();
      this._wired = true;
    }
  }

  renderSlotCard(slotKey, label, build, other, lang, dict) {
    const car = build.car;
    const parts = this.state[slotKey].parts;
    const speedPct = Math.min(100, Math.max(4, ((build.speed - 70) / 62) * 100));
    const baseSpeedPct = Math.min(100, Math.max(4, ((car.speed - 70) / 62) * 100));
    const dfPct = Math.min(100, Math.max(4, ((build.df - 7.5) / 7.5) * 100));
    const baseDfPct = Math.min(100, Math.max(4, ((car.df - 7.5) / 7.5) * 100));

    const optionsHtml = [
      { grp: dict.vehOptPlayer, items: VEHICLES.filter((v) => v.category === "car") },
      { grp: dict.vehOptPolice, items: VEHICLES.filter((v) => v.category === "police") },
    ].map(({ grp, items }) => `
      <optgroup label="${escapeHtml(grp)}">
        ${items.map((v) => `<option value="${v.id}"${v.id === car.id ? " selected" : ""}>${escapeHtml(carDisplayLabel(v, lang))}${v.price ? ` · ${formatMoney(v.price, lang)}` : ""}</option>`).join("")}
      </optgroup>
    `).join("");

    const policePills = POLICE_BENCHMARKS.map((cop) => {
      const spdDiff = +(build.speed - cop.speed).toFixed(1);
      const dfDiff = +(build.df - cop.df).toFixed(2);
      let cls = "lose";
      let icon = "✕";
      if (spdDiff >= 0.4 && dfDiff >= 0) { cls = "win"; icon = "✓"; }
      else if (spdDiff >= -0.5 || dfDiff > 0.3) { cls = "close"; icon = "~"; }
      return `
        <div class="veh-cop-pill ${cls}" title="Vmax ${spdDiff >= 0 ? "+" : ""}${fmtNum(spdDiff, lang, 1)} km/h · DF ${dfDiff >= 0 ? "+" : ""}${fmtNum(dfDiff, lang, 2)}">
          <span class="cop-ic">${icon}</span>
          <strong>${cop.short}</strong>
          <span class="cop-nums">${spdDiff >= 0 ? "+" : ""}${fmtNum(spdDiff, lang, 1)} km/h · ${dfDiff >= 0 ? "+" : ""}${fmtNum(dfDiff, lang, 2)} DF</span>
        </div>
      `;
    }).join("");

    const partsEditorHtml = car.upgradeable ? `
      <div class="veh-parts-grid">
        ${this.renderPartSelect(slotKey, "ecu", dict.vehPartEcu, parts.ecu, [
          { val: "none", lbl: dict.vehNone },
          { val: "uncommon", lbl: `${dict.rarities.Uncommon} (+${fmtNum(car.mods.ecu.uncommon, lang, 1)} km/h · ${formatMoney(PART_PRICES.ecu.uncommon, lang)})` },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${fmtNum(car.mods.ecu.epic, lang, 1)} km/h · ${formatMoney(PART_PRICES.ecu.epic, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${fmtNum(car.mods.ecu.legendary, lang, 1)} km/h · ${formatMoney(PART_PRICES.ecu.legendary, lang)})` },
        ])}
        ${this.renderPartSelect(slotKey, "turbo", dict.vehPartTurbo, parts.turbo, [
          { val: "none", lbl: dict.vehNone },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${fmtNum(car.mods.turbo.epic, lang, 2)} DF · ${formatMoney(PART_PRICES.turbo.epic, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${fmtNum(car.mods.turbo.legendary, lang, 2)} DF · ${formatMoney(PART_PRICES.turbo.legendary, lang)})` },
        ])}
        ${this.renderPartSelect(slotKey, "intercooler", dict.vehPartIntercooler, parts.intercooler, [
          { val: "none", lbl: dict.vehNone },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${fmtNum(car.mods.intercooler.epic, lang, 2)} DF · ${formatMoney(PART_PRICES.intercooler.epic, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${fmtNum(car.mods.intercooler.legendary, lang, 2)} DF · ${formatMoney(PART_PRICES.intercooler.legendary, lang)})` },
        ])}
        ${this.renderPartSelect(slotKey, "steering", dict.vehPartSteering, parts.steering, [
          { val: "none", lbl: dict.vehNone },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${fmtNum(car.mods.steering.epic[0], lang, 2)} / +${fmtNum(car.mods.steering.epic[1], lang, 2)} · ${formatMoney(PART_PRICES.steering.epic, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${fmtNum(car.mods.steering.legendary[0], lang, 2)} / +${fmtNum(car.mods.steering.legendary[1], lang, 2)} · ${formatMoney(PART_PRICES.steering.legendary, lang)})` },
        ])}
        ${this.renderPartSelect(slotKey, "brake", dict.vehPartBrake, parts.brake, [
          { val: "none", lbl: dict.vehNone },
          { val: "uncommon", lbl: `${dict.rarities.Uncommon} (+${fmtNum(car.mods.brake.uncommon[0], lang, 2)} / +${fmtNum(car.mods.brake.uncommon[1], lang, 2)} · ${formatMoney(PART_PRICES.brake.uncommon, lang)})` },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${fmtNum(car.mods.brake.epic[0], lang, 2)} / +${fmtNum(car.mods.brake.epic[1], lang, 2)} · ${formatMoney(PART_PRICES.brake.epic, lang)})` },
        ])}
        ${car.trunkSlots > 0 ? this.renderPartSelect(slotKey, "trunk", `${dict.vehPartTrunk} (${car.trunkSlots}×)`, parts.trunk, [
          { val: "none", lbl: dict.vehNone },
          { val: "uncommon", lbl: `${dict.rarities.Uncommon} (+${car.trunkSlots} ${dict.vehRowsShort} · ${formatMoney(PART_PRICES.trunk.uncommon * car.trunkSlots, lang)})` },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${2 * car.trunkSlots} ${dict.vehRowsShort} · ${formatMoney(PART_PRICES.trunk.epic * car.trunkSlots, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${3 * car.trunkSlots} ${dict.vehRowsShort} · ${formatMoney(PART_PRICES.trunk.legendary * car.trunkSlots, lang)})` },
        ]) : ""}
        ${car.cargoSlots > 0 ? this.renderPartSelect(slotKey, "cargo", `${dict.vehPartCargo} (${car.cargoSlots}×)`, parts.cargo, [
          { val: "none", lbl: dict.vehNone },
          { val: "epic", lbl: `${dict.rarities.Epic} (+${car.cargoSlots} ${dict.vehCargoShort} · ${formatMoney(PART_PRICES.cargo.epic * car.cargoSlots, lang)})` },
          { val: "legendary", lbl: `${dict.rarities.Legendary} (+${2 * car.cargoSlots} ${dict.vehCargoShort} · ${formatMoney(PART_PRICES.cargo.legendary * car.cargoSlots, lang)})` },
        ]) : ""}
      </div>
    ` : `<div class="veh-locked-note">${escapeHtml(dict.vehNoUpgrades)}</div>`;

    const rarityTag = car.category === "police"
      ? `<span class="veh-tag tag-cop">${escapeHtml(dict.vehFilterPolice)}</span>`
      : `<span class="veh-tag tag-${car.rarity.toLowerCase()}">T${car.tier} · ${escapeHtml(dict.rarities[car.rarity] || car.rarity)}</span>`;

    return `
      <div class="veh-card slot-${label.toLowerCase()}">
        <div class="veh-card-top">
          <div class="veh-slot-picker">
            <span class="veh-slot-badge">${label}</span>
            <select class="veh-car-select" data-slot-car="${slotKey}">
              ${optionsHtml}
            </select>
            ${rarityTag}
          </div>
          ${car.upgradeable ? `
            <div class="veh-preset-row">
              <button class="veh-mini-btn" data-slot-preset="${slotKey}:none">${escapeHtml(dict.vehStock)}</button>
              <button class="veh-mini-btn rar-btn-epic" data-slot-preset="${slotKey}:epic">${escapeHtml(dict.vehFullEpic)}</button>
              <button class="veh-mini-btn rar-btn-leg" data-slot-preset="${slotKey}:legendary">${escapeHtml(dict.vehFullLeg)}</button>
            </div>
          ` : ""}
        </div>

        <!-- Key Computed Performance Bars -->
        <div class="veh-metrics">
          <div class="veh-metric-block">
            <div class="veh-m-head">
              <span class="veh-m-lbl">${escapeHtml(dict.vehTopSpeed)}</span>
              <div class="veh-m-vals">
                <strong class="veh-big-num">${fmtNum(build.speed, lang, 1)} <small>km/h</small></strong>
                ${build.speedBonus > 0 ? `<span class="veh-bonus">(+${fmtNum(build.speedBonus, lang, 1)})</span>` : ""}
                ${fmtDelta(build.speed - other.speed, " km/h", lang, 1)}
              </div>
            </div>
            <div class="veh-bar-track">
              <div class="veh-bar-tuned ${parts.ecu === "legendary" ? "b-leg" : parts.ecu === "epic" ? "b-epic" : car.category === "police" ? "b-cop" : "b-unc"}" style="width:${speedPct.toFixed(1)}%"></div>
              <div class="veh-bar-base" style="width:${baseSpeedPct.toFixed(1)}%"></div>
            </div>
          </div>

          <div class="veh-metric-block">
            <div class="veh-m-head">
              <span class="veh-m-lbl">${escapeHtml(dict.vehAccel)} <small>(${car.gears} ${escapeHtml(dict.vehGears)})</small></span>
              <div class="veh-m-vals">
                <strong class="veh-big-num">${fmtNum(build.df, lang, 2)} <small>DF</small></strong>
                ${build.dfBonus > 0 ? `<span class="veh-bonus">(+${fmtNum(build.dfBonus, lang, 2)})</span>` : ""}
                ${fmtDelta(build.df - other.df, " DF", lang, 2)}
              </div>
            </div>
            <div class="veh-bar-track">
              <div class="veh-bar-tuned ${build.dfBonus >= 1.6 ? "b-leg" : build.dfBonus > 0 ? "b-epic" : car.category === "police" ? "b-cop" : "b-unc"}" style="width:${dfPct.toFixed(1)}%"></div>
              <div class="veh-bar-base" style="width:${baseDfPct.toFixed(1)}%"></div>
            </div>
          </div>
        </div>

        <!-- Secondary Spec Tiles -->
        <div class="veh-spec-grid">
          <div class="veh-spec">
            <span class="veh-spec-k">${escapeHtml(dict.vehCornerGrip)}</span>
            <span class="veh-spec-v">${build.steerF > 0 ? `+${fmtNum(build.steerF, lang, 2)} / +${fmtNum(build.steerR, lang, 2)}` : "—"}</span>
          </div>
          <div class="veh-spec">
            <span class="veh-spec-k">${escapeHtml(dict.vehBrakes)}</span>
            <span class="veh-spec-v">${fmtNum(car.brake, lang, 0)}${build.brakeF > 0 ? ` <small>(+${fmtNum(build.brakeF, lang, 2)})</small>` : ""}</span>
          </div>
          <div class="veh-spec">
            <span class="veh-spec-k">${escapeHtml(dict.vehTrunkCargo)}</span>
            <span class="veh-spec-v">${build.trunk} ${escapeHtml(dict.vehRowsShort)} (${build.trunk * 6}) · ${build.cargo} ${escapeHtml(dict.vehCargoShort)}</span>
          </div>
          <div class="veh-spec">
            <span class="veh-spec-k">${escapeHtml(dict.vehCost)}</span>
            <span class="veh-spec-v">${car.price ? formatMoney(car.price, lang) : "—"}${build.partsCost > 0 ? ` <small>+ ${formatMoney(build.partsCost, lang)}</small>` : ""}</span>
          </div>
        </div>

        <!-- Police Chase Check -->
        ${car.category !== "police" ? `
          <div class="veh-cop-bar">
            <span class="veh-cop-lbl">${escapeHtml(dict.vehVsPolice)}</span>
            <div class="veh-cop-pills">${policePills}</div>
          </div>
        ` : ""}

        <!-- Individual Part Selectors -->
        ${partsEditorHtml}
      </div>
    `;
  }

  renderPartSelect(slotKey, partKey, label, currentVal, options) {
    const rarCls = currentVal !== "none" ? `part-${currentVal}` : "";
    return `
      <label class="veh-part-field ${rarCls}">
        <span>${escapeHtml(label)}</span>
        <select data-slot-part="${slotKey}:${partKey}">
          ${options.map((o) => `<option value="${o.val}"${o.val === currentVal ? " selected" : ""}>${escapeHtml(o.lbl)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  renderFleetRows(lang, dict) {
    const preset = presetParts(this.state.fleetPreset);
    let rows = VEHICLES.map((v) => computeBuild(v.id, v.upgradeable ? preset : null));

    if (this.state.fleetFilter === "t2plus") {
      rows = rows.filter((r) => r.car.tier >= 2 || r.car.category === "police");
    } else if (this.state.fleetFilter === "police") {
      rows = rows.filter((r) => r.car.category === "police");
    } else if (this.state.fleetFilter === "4seat") {
      rows = rows.filter((r) => r.car.seats >= 4);
    }

    const s = this.state.fleetSort;
    rows.sort((a, b) => {
      if (s === "df") return b.df - a.df || b.speed - a.speed;
      if (s === "cargo") return (b.cargo * 10 + b.trunk) - (a.cargo * 10 + a.trunk);
      if (s === "price") return (a.car.price || 99999999) - (b.car.price || 99999999);
      return b.speed - a.speed || b.df - a.df;
    });

    return rows.map((r) => {
      const car = r.car;
      const spdPct = Math.min(100, Math.max(4, ((r.speed - 70) / 62) * 100));
      const baseSpdPct = Math.min(100, Math.max(4, ((car.speed - 70) / 62) * 100));
      const dfPct = Math.min(100, Math.max(4, ((r.df - 7.5) / 7.5) * 100));
      const baseDfPct = Math.min(100, Math.max(4, ((car.df - 7.5) / 7.5) * 100));

      const barCls = car.category === "police"
        ? (car.id === "police_wild" ? "b-cop-wild" : "b-cop")
        : this.state.fleetPreset === "legendary" ? "b-leg"
        : this.state.fleetPreset === "epic" ? "b-epic" : "b-unc";

      const tagHtml = car.category === "police"
        ? `<span class="veh-tag tag-cop">${escapeHtml(dict.vehFilterPolice)}</span>`
        : `<span class="veh-tag tag-${car.rarity.toLowerCase()}">T${car.tier}</span>`;

      const inA = this.state.slotA.carId === car.id;
      const inB = this.state.slotB.carId === car.id;

      return `
        <div class="veh-fleet-row${car.category === "police" ? " is-police" : ""}">
          <div class="vf-name-cell">
            <div class="vf-name-top">
              <strong>${escapeHtml(car.name)}</strong>
              ${tagHtml}
            </div>
            <div class="vf-name-sub">
              ${escapeHtml(car.alias?.[lang] || "")} · ${car.seats} ${escapeHtml(dict.vehSeats)} · ${car.gears} ${escapeHtml(dict.vehGears)}${car.price ? ` · ${formatMoney(car.price, lang)}` : ""}
            </div>
          </div>

          <div class="vf-bar-cell">
            <div class="vf-bar-nums">
              <strong>${fmtNum(r.speed, lang, 1)} km/h</strong>
              <span>${r.speedBonus > 0 ? `+${fmtNum(r.speedBonus, lang, 1)}` : (car.category === "police" ? dict.vehFixed : dict.vehStock)}</span>
            </div>
            <div class="veh-bar-track sm">
              <div class="veh-bar-tuned ${barCls}" style="width:${spdPct.toFixed(1)}%"></div>
              <div class="veh-bar-base" style="width:${baseSpdPct.toFixed(1)}%"></div>
            </div>
          </div>

          <div class="vf-bar-cell">
            <div class="vf-bar-nums">
              <strong>${fmtNum(r.df, lang, 2)} DF</strong>
              <span>${r.dfBonus > 0 ? `+${fmtNum(r.dfBonus, lang, 2)}` : "—"}</span>
            </div>
            <div class="veh-bar-track sm">
              <div class="veh-bar-tuned ${barCls}" style="width:${dfPct.toFixed(1)}%"></div>
              <div class="veh-bar-base" style="width:${baseDfPct.toFixed(1)}%"></div>
            </div>
          </div>

          <div class="vf-space-cell">
            <div><strong>${r.trunk}</strong> ${escapeHtml(dict.vehRowsShort)} <small>(${r.trunk * 6})</small></div>
            <div><strong>${r.cargo}</strong> ${escapeHtml(dict.vehCargoShort)}</div>
          </div>

          <div class="vf-act-cell">
            <button class="veh-load-btn${inA ? " active-a" : ""}" data-load-slot="slotA:${car.id}" title="${escapeHtml(dict.vehLoadA)}">→ A</button>
            <button class="veh-load-btn${inB ? " active-b" : ""}" data-load-slot="slotB:${car.id}" title="${escapeHtml(dict.vehLoadB)}">→ B</button>
          </div>
        </div>
      `;
    }).join("");
  }

  _wireEvents() {
    this.root.addEventListener("change", (e) => {
      const carSel = e.target.closest("[data-slot-car]");
      if (carSel) {
        const slot = carSel.dataset.slotCar;
        this.state[slot].carId = carSel.value;
        this.render();
        return;
      }
      const partSel = e.target.closest("[data-slot-part]");
      if (partSel) {
        const [slot, partKey] = partSel.dataset.slotPart.split(":");
        this.state[slot].parts[partKey] = partSel.value;
        this.render();
        return;
      }
      if (e.target.id === "veh-fleet-sort") {
        this.state.fleetSort = e.target.value;
        this.render();
      }
    });

    this.root.addEventListener("click", (e) => {
      const sp = e.target.closest("[data-slot-preset]");
      if (sp) {
        const [slot, preset] = sp.dataset.slotPreset.split(":");
        this.state[slot].parts = presetParts(preset);
        this.render();
        return;
      }
      const fp = e.target.closest("[data-fleet-preset]");
      if (fp) {
        this.state.fleetPreset = fp.dataset.fleetPreset;
        this.render();
        return;
      }
      const ff = e.target.closest("[data-fleet-filter]");
      if (ff) {
        this.state.fleetFilter = ff.dataset.fleetFilter;
        this.render();
        return;
      }
      const ls = e.target.closest("[data-load-slot]");
      if (ls) {
        const [slot, carId] = ls.dataset.loadSlot.split(":");
        this.state[slot] = { carId, parts: presetParts(this.state.fleetPreset) };
        this.render();
        this.root.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const mu = e.target.closest("[data-matchup]");
      if (mu) {
        const id = mu.dataset.matchup;
        if (id === "bmw-lila-gold") {
          this.state.slotA = { carId: "royal_e", parts: presetParts("epic") };
          this.state.slotB = { carId: "royal_e", parts: presetParts("legendary") };
        } else if (id === "bmw-vs-dodge") {
          this.state.slotA = { carId: "royal_e", parts: presetParts("legendary") };
          this.state.slotB = { carId: "longhorn_wild", parts: presetParts("legendary") };
        } else if (id === "dodge-vs-wildguard") {
          this.state.slotA = { carId: "longhorn_wild", parts: presetParts("epic") };
          this.state.slotB = { carId: "police_wild", parts: presetParts("none") };
        } else if (id === "dodge-vs-buletti") {
          this.state.slotA = { carId: "longhorn_wild", parts: presetParts("legendary") };
          this.state.slotB = { carId: "buletti_soltempra", parts: presetParts("legendary") };
        } else if (id === "bmw-vs-outrider") {
          this.state.slotA = { carId: "royal_e", parts: presetParts("legendary") };
          this.state.slotB = { carId: "police_outrider", parts: presetParts("none") };
        }
        this.render();
      }
    });
  }
}
