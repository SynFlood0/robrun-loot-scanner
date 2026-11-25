// Pure client-side computer-vision scanner for Rob Run container screenshots
// Zero external dependencies — runs in <150ms per screenshot in any modern browser.

export class RobRunScanner {
  constructor() {
    this.db = null;
    this.itemsById = new Map();
    this.T = 24;
    this.templatesByWH = new Map();
    this.ready = false;
  }

  async init(basePath = ".") {
    const [dbRes, metaRes, binRes] = await Promise.all([
      fetch(`${basePath}/data/db.json`),
      fetch(`${basePath}/data/templates_meta.json`),
      fetch(`${basePath}/data/templates.bin`),
    ]);
    if (!dbRes.ok || !metaRes.ok || !binRes.ok) {
      throw new Error("Failed to load scanner database files.");
    }
    this.db = await dbRes.json();
    const meta = await metaRes.json();
    const bin = new Uint8Array(await binRes.arrayBuffer());
    this.T = meta.T;

    this.itemsById.clear();
    for (const it of this.db.items) {
      this.itemsById.set(it.id, it);
    }

    this.templatesByWH.clear();
    for (const entry of meta.entries) {
      const it = this.db.items[entry.i];
      const W = entry.w * this.T;
      const H = entry.h * this.T;
      const len = W * H * 4;
      const rgba = bin.subarray(entry.o, entry.o + len);
      const key = `${entry.w}x${entry.h}`;
      if (!this.templatesByWH.has(key)) this.templatesByWH.set(key, []);
      this.templatesByWH.get(key).push({ item: it, W, H, rgba });
    }
    this.ready = true;
    return this.db;
  }

  // Extract RGB Float/Uint8 data from an HTMLImageElement / ImageBitmap
  imageToPixels(img) {
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    return { W, H, data, canvas: c };
  }

  detectGrid(W, H, data, override = null) {
    if (override && override.x0 != null) {
      return {
        x0: override.x0,
        y0: override.y0,
        cw: override.cw,
        ch: override.ch ?? override.cw,
        ncols: override.ncols ?? 6,
        nrows: override.nrows,
      };
    }

    const gray = new Float32Array(W * H);
    const sat = new Float32Array(W * H);
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      const r = data[p], g = data[p + 1], b = data[p + 2];
      gray[i] = (r + g + b) / 3;
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      sat[i] = mx - mn;
    }

    // 1. Detect UI panel horizontal span from header bar (y = 6 .. min(44, H/4))
    // Panel header is neutral warm-gray (g 34..92, sat < 22) plus white/anti-aliased title text (g >= 34, sat < 24)
    const hy0 = Math.min(6, H - 1);
    const hy1 = Math.max(hy0 + 4, Math.min(44, Math.floor(H / 4)));
    const hRows = hy1 - hy0;
    let pLeft = 0, pRight = W, maxRun = 0, curS = -1;
    for (let x = 0; x <= W; x++) {
      let ok = false;
      if (x < W) {
        let cnt = 0;
        for (let y = hy0; y < hy1; y++) {
          const idx = y * W + x;
          const g = gray[idx], s = sat[idx];
          if (g > 34 && s < 24) cnt++;
        }
        ok = cnt / hRows > 0.65;
      }
      if (ok && curS === -1) curS = x;
      else if (!ok && curS !== -1) {
        if (x - curS > maxRun) {
          maxRun = x - curS;
          pLeft = curS;
          pRight = x;
        }
        curS = -1;
      }
    }
    if (pRight - pLeft < W * 0.72) {
      pLeft = 0;
      pRight = W;
    }

    // 2. Vertical ridge profile inside [pLeft, pRight]
    const ys0 = Math.floor(H * 0.18);
    const ys1 = Math.floor(H * 0.88);
    const ySpan = Math.max(1, ys1 - ys0);
    const vRidge = new Float32Array(W);
    for (let x = Math.max(5, pLeft + 3); x < Math.min(W - 5, pRight - 3); x++) {
      let cR = 0, cL = 0, cRt = 0;
      for (let y = ys0; y < ys1; y++) {
        const rowOff = y * W;
        const mid = gray[rowOff + x];
        const sm = sat[rowOff + x];
        if (sm < 14 && mid > 45 && mid < 80) {
          const l = gray[rowOff + x - 4];
          const r = gray[rowOff + x + 4];
          if (mid > l + 3.5 && mid > r + 3.5) cR++;
          if (mid > 46 && mid > r + 5 && Math.abs(mid - l) < 10) cL++;
          if (mid > 46 && mid > l + 5 && Math.abs(mid - r) < 10) cRt++;
        }
      }
      vRidge[x] = (cR + 0.35 * (cL + cRt)) / ySpan;
    }
    const vSm = new Float32Array(W);
    for (let x = 1; x < W - 1; x++) {
      vSm[x] = 0.25 * vRidge[x - 1] + 0.5 * vRidge[x] + 0.25 * vRidge[x + 1];
    }

    const ncols = override?.ncols ?? 6;
    const panelW = pRight - pLeft;
    const minCw = Math.max(36, (panelW * 0.76) / ncols);
    const maxCw = (panelW * 0.97) / ncols;
    let bestScoreX = -1e9, bestX0 = pLeft + 10, bestCw = panelW / ncols;

    for (let cw2 = Math.floor(minCw * 2); cw2 <= Math.ceil(maxCw * 2); cw2++) {
      const cw = cw2 / 2;
      const maxX0 = Math.floor(pRight - ncols * cw - 3);
      for (let x0 = pLeft + 4; x0 <= maxX0; x0++) {
        const xEnd = Math.round(x0 + ncols * cw);
        if (xEnd >= pRight - 2) continue;
        let inner = 0;
        for (let k = 1; k < ncols; k++) {
          const xi = Math.round(x0 + k * cw);
          inner += Math.min(vSm[xi], 0.45);
        }
        const outer = Math.min(vSm[x0], 0.35) + Math.min(vSm[xEnd], 0.35);
        const symPen = -0.004 * Math.abs((x0 - pLeft) - (pRight - xEnd));
        const sc = inner + 0.4 * outer + symPen;
        if (sc > bestScoreX) {
          bestScoreX = sc;
          bestX0 = x0;
          bestCw = cw;
        }
      }
    }

    // 3. Horizontal step-drop profile inside detected columns
    const xg0 = Math.max(0, Math.floor(bestX0 + 4));
    const xg1 = Math.min(W, Math.floor(bestX0 + ncols * bestCw - 4));
    const xSpan = Math.max(1, xg1 - xg0);
    const hScore = new Float32Array(H);
    for (let y = 5; y < H - 5; y++) {
      let cDrop = 0, cStep = 0;
      const rAbove = (y - 4) * W;
      const rMid = y * W;
      const rBelow = (y + 3) * W;
      for (let x = xg0; x < xg1; x++) {
        const below = gray[rBelow + x];
        if (below < 52) {
          const mid = gray[rMid + x];
          const sm = sat[rMid + x];
          if (mid > below + 6 && sm < 16 && mid > 45 && mid < 80) cDrop++;
          if (below < 50 && gray[rAbove + x] > below + 10) cStep++;
        }
      }
      hScore[y] = (cDrop + 0.5 * cStep) / xSpan;
    }
    const hSm = new Float32Array(H);
    for (let y = 1; y < H - 1; y++) {
      hSm[y] = 0.25 * hScore[y - 1] + 0.5 * hScore[y] + 0.25 * hScore[y + 1];
    }

    const minCh = bestCw * 0.96;
    const maxCh = bestCw * 1.04;
    const minY0 = Math.max(6, Math.floor(bestCw * 0.5));
    const maxY0 = Math.min(H - Math.floor(2 * bestCw), Math.floor(bestCw * 1.4));
    let bestScoreY = -1e9, bestY0 = minY0, bestCh = bestCw, bestNr = 4;

    const topSample = new Float32Array(xSpan * 4);
    for (let ch2 = Math.floor(minCh * 2); ch2 <= Math.ceil(maxCh * 2); ch2++) {
      const ch = ch2 / 2;
      for (let y0 = minY0; y0 <= maxY0; y0++) {
        const maxR = Math.min(10, Math.floor((H - 2 - y0) / ch));
        if (maxR < 2) continue;
        let nr = maxR;
        while (nr > 2) {
          const ry0 = Math.round(y0 + (nr - 1) * ch);
          let t = 0;
          for (let dy = 3; dy < 7 && ry0 + dy < H; dy++) {
            const off = (ry0 + dy) * W;
            for (let x = xg0; x < xg1; x++) topSample[t++] = gray[off + x];
          }
          const med = quickMedian(topSample, t);
          if (med > 52) nr--;
          else break;
        }
        let sumH = 0;
        for (let k = 0; k < nr; k++) {
          sumH += Math.min(hSm[Math.round(y0 + k * ch)], 0.55);
        }
        const sc = sumH / nr + 0.015 * nr;
        if (sc > bestScoreY) {
          bestScoreY = sc;
          bestY0 = y0;
          bestCh = ch;
          bestNr = nr;
        }
      }
    }

    return { x0: bestX0, y0: bestY0, cw: bestCw, ch: bestCh, ncols, nrows: bestNr, gray, sat };
  }

  classifyRarity(W, H, data, px0, py0, px1, py1) {
    const x0 = Math.max(0, px0 + 2);
    const y0 = Math.max(0, py0 + 2);
    const x1 = Math.min(W, px1 - 2);
    const y1 = Math.min(H, py1 - 2);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w < 6 || h < 6) return "Common";

    const rs = [], gs = [], bs = [], lums = [];
    const addPt = (x, y) => {
      const p = (y * W + x) * 4;
      const r = data[p], g = data[p + 1], b = data[p + 2];
      rs.push(r); gs.push(g); bs.push(b); lums.push((r + g + b) / 3);
    };

    // Bottom glow band (excluding stack count on right and progress bar on very bottom)
    const by0 = Math.max(y0, y1 - 16);
    const by1 = Math.max(by0 + 1, y1 - 5);
    const bx1 = Math.min(x1, x0 + Math.max(4, Math.floor(w * 0.65)));
    for (let y = by0; y < by1; y++) {
      for (let x = x0 + 2; x < bx1; x += 2) addPt(x, y);
    }
    // Lower side edges
    const sy0 = y0 + Math.floor(h / 3);
    const sy1 = Math.max(sy0 + 1, y1 - 6);
    for (let y = sy0; y < sy1; y += 2) {
      for (let dx = 0; dx < 5 && x0 + dx < x1; dx++) addPt(x0 + dx, y);
      for (let dx = 1; dx <= 5 && x1 - dx >= x0; dx++) addPt(x1 - dx, y);
    }
    if (lums.length === 0) return "Common";

    const sortedLums = lums.slice().sort((a, b) => a - b);
    const thresh = sortedLums[Math.floor(sortedLums.length * 0.55)];
    const fR = [], fG = [], fB = [];
    for (let i = 0; i < lums.length; i++) {
      if (lums[i] <= thresh) {
        fR.push(rs[i]); fG.push(gs[i]); fB.push(bs[i]);
      }
    }
    fR.sort((a, b) => a - b);
    fG.sort((a, b) => a - b);
    fB.sort((a, b) => a - b);
    const m = Math.floor(fR.length / 2);
    const R = fR[m], G = fG[m], B = fB[m];

    if (R - B > 22 && G - B > 15 && R > G - 6) return "Legendary";
    if (R - G > 8 && B - G > 6) return "Epic";
    if (G - R > 8 && G - B > 6) return "Uncommon";
    return "Common";
  }

  scoreCrop(srcCanvas, W, H, data, grid, c, r, wc, hc) {
    const px0 = Math.round(grid.x0 + c * grid.cw) + 2;
    const py0 = Math.round(grid.y0 + r * grid.ch) + 2;
    const px1 = Math.round(grid.x0 + (c + wc) * grid.cw) - 2;
    const py1 = Math.round(grid.y0 + (r + hc) * grid.ch) - 2;
    const rarity = this.classifyRarity(W, H, data, px0, py0, px1, py1);

    const tw = wc * this.T;
    const th = hc * this.T;
    const tmp = document.createElement("canvas");
    tmp.width = tw;
    tmp.height = th;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = "medium";
    tctx.drawImage(srcCanvas, px0, py0, Math.max(1, px1 - px0), Math.max(1, py1 - py0), 0, 0, tw, th);
    const crop = tctx.getImageData(0, 0, tw, th).data;

    // Per-row 25th percentile background estimate for foreground difference mask
    const fgDiff = new Float32Array(tw * th);
    const rowR = new Float32Array(tw);
    const rowG = new Float32Array(tw);
    const rowB = new Float32Array(tw);
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const p = (y * tw + x) * 4;
        rowR[x] = crop[p]; rowG[x] = crop[p + 1]; rowB[x] = crop[p + 2];
      }
      const bR = quickPercentile(rowR, tw, 0.25);
      const bG = quickPercentile(rowG, tw, 0.25);
      const bB = quickPercentile(rowB, tw, 0.25);
      for (let x = 0; x < tw; x++) {
        const p = (y * tw + x) * 4;
        fgDiff[y * tw + x] = (Math.abs(crop[p] - bR) + Math.abs(crop[p + 1] - bG) + Math.abs(crop[p + 2] - bB)) / 3;
      }
    }

    // Valid pixel mask (excludes bottom-right stack count, bottom-left magnifying glass, bottom 3px bar, 2px borders)
    const valid = new Uint8Array(tw * th);
    for (let y = 2; y < th - 3; y++) {
      for (let x = 2; x < tw - 2; x++) {
        if (y >= th - 9 && x >= tw - 11) continue;
        if (y >= th - 8 && x < 8) continue;
        valid[y * tw + x] = 1;
      }
    }

    // Detect white horizontal progress bar near bottom (Filling items!)
    let barBright = 0, barTot = 0;
    for (let y = Math.max(0, th - 3); y < th - 1; y++) {
      for (let x = 3; x < tw - 3; x++) {
        const p = (y * tw + x) * 4;
        if ((crop[p] + crop[p + 1] + crop[p + 2]) / 3 > 175) barBright++;
        barTot++;
      }
    }
    const hasBar = barTot > 0 && barBright / barTot > 0.08;

    const cands = this.templatesByWH.get(`${wc}x${hc}`) || [];
    const scored = [];

    for (let k = 0; k < cands.length; k++) {
      const cand = cands[k];
      const it = cand.item;
      const rarMatch = it.rarity === rarity;
      if (!rarMatch) {
        if ((rarity === "Epic" || rarity === "Legendary") && it.rarity !== "Exotic") continue;
        if ((rarity === "Uncommon" || rarity === "Common") && (it.rarity === "Epic" || it.rarity === "Legendary")) continue;
      }

      let statePen = 0;
      if (it.state === "Filling") statePen = hasBar ? 0.22 : -0.18;
      else if (it.state === "Full") statePen = hasBar ? -0.18 : 0;

      const tmpl = cand.rgba;
      let fgN = 0, bgN = 0, unexp = 0, fgCov = 0;
      let sTr = 0, sTg = 0, sTb = 0, sCr = 0, sCg = 0, sCb = 0, l1Sum = 0;

      for (let i = 0, p = 0; i < tw * th; i++, p += 4) {
        if (!valid[i]) continue;
        const a = tmpl[p + 3];
        if (a > 100) {
          fgN++;
          const tr = tmpl[p], tg = tmpl[p + 1], tb = tmpl[p + 2];
          const cr = crop[p], cg = crop[p + 1], cb = crop[p + 2];
          sTr += tr; sTg += tg; sTb += tb;
          sCr += cr; sCg += cg; sCb += cb;
          l1Sum += Math.abs(tr - cr) + Math.abs(tg - cg) + Math.abs(tb - cb);
          if (fgDiff[i] > 12) fgCov++;
        } else if (a < 20) {
          bgN++;
          if (fgDiff[i] > 18) unexp++;
        }
      }
      if (fgN < 10) continue;

      const mTr = sTr / fgN, mTg = sTg / fgN, mTb = sTb / fgN;
      const mCr = sCr / fgN, mCg = sCg / fgN, mCb = sCb / fgN;
      let dot = 0, nT = 0, nC = 0;
      for (let i = 0, p = 0; i < tw * th; i++, p += 4) {
        if (!valid[i] || tmpl[p + 3] <= 100) continue;
        const dTr = tmpl[p] - mTr, dTg = tmpl[p + 1] - mTg, dTb = tmpl[p + 2] - mTb;
        const dCr = crop[p] - mCr, dCg = crop[p + 1] - mCg, dCb = crop[p + 2] - mCb;
        dot += dTr * dCr + dTg * dCg + dTb * dCb;
        nT += dTr * dTr + dTg * dTg + dTb * dTb;
        nC += dCr * dCr + dCg * dCg + dCb * dCb;
      }

      const corr = dot / (Math.sqrt(nT * nC) + 1e-6);
      const l1 = l1Sum / (fgN * 3 * 255);
      const unexpRate = bgN > 8 ? unexp / bgN : 0;
      const fgCovRate = fgCov / fgN;
      const rarBonus = rarMatch ? 0.08 : -0.05;
      const score = corr - 0.85 * l1 - 0.55 * unexpRate + 0.25 * fgCovRate + rarBonus + statePen;
      scored.push({ item: it, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);
    return {
      item: top5[0]?.item || null,
      score: top5[0]?.score ?? -1,
      rarity,
      hasBar,
      top5,
    };
  }

  scan(img, gridOverride = null) {
    if (!this.ready) throw new Error("Scanner not initialized");
    const { W, H, data, canvas } = this.imageToPixels(img);
    const grid = this.detectGrid(W, H, data, gridOverride);

    // Ensure gray/sat buffers exist even if gridOverride was used
    let gray = grid.gray, sat = grid.sat;
    if (!gray) {
      gray = new Float32Array(W * H);
      sat = new Float32Array(W * H);
      for (let i = 0, p = 0; i < W * H; i++, p += 4) {
        const r = data[p], g = data[p + 1], b = data[p + 2];
        gray[i] = (r + g + b) / 3;
        const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
        sat[i] = mx - mn;
      }
    }

    const { x0, y0, cw, ch, ncols, nrows } = grid;
    const cellEmpty = Array.from({ length: nrows }, () => new Uint8Array(ncols));
    const cellRar = Array.from({ length: nrows }, () => new Array(ncols).fill("Common"));

    // 1. Per-cell empty + rarity detection
    for (let r = 0; r < nrows; r++) {
      for (let c = 0; c < ncols; c++) {
        const px0 = Math.round(x0 + c * cw);
        const py0 = Math.round(y0 + r * ch);
        const px1 = Math.round(x0 + (c + 1) * cw);
        const py1 = Math.round(y0 + (r + 1) * ch);
        let sum = 0, sum2 = 0, satSum = 0, n = 0;
        const ix0 = Math.max(0, px0 + 7), ix1 = Math.min(W, px1 - 7);
        const iy0 = Math.max(0, py0 + 7), iy1 = Math.min(H, py1 - 7);
        for (let y = iy0; y < iy1; y++) {
          for (let x = ix0; x < ix1; x++) {
            const p = (y * W + x) * 4;
            const rv = data[p], gv = data[p + 1], bv = data[p + 2];
            sum += rv + gv + bv;
            sum2 += rv * rv + gv * gv + bv * bv;
            const mx = rv > gv ? (rv > bv ? rv : bv) : (gv > bv ? gv : bv);
            const mn = rv < gv ? (rv < bv ? rv : bv) : (gv < bv ? gv : bv);
            satSum += mx - mn;
            n++;
          }
        }
        const n3 = Math.max(1, n * 3);
        const mean = sum / n3;
        const std = Math.sqrt(Math.max(0, sum2 / n3 - mean * mean));
        const meanSat = satSum / Math.max(1, n);
        if (std < 8.0 && meanSat < 6.5) {
          cellEmpty[r][c] = 1;
          cellRar[r][c] = "Empty";
        } else {
          cellRar[r][c] = this.classifyRarity(W, H, data, px0, py0, px1, py1);
        }
      }
    }

    // 2. Seam divider strength
    const vStr = Array.from({ length: nrows }, () => new Float32Array(Math.max(0, ncols - 1)));
    const hStr = Array.from({ length: Math.max(0, nrows - 1) }, () => new Float32Array(ncols));

    for (let r = 0; r < nrows; r++) {
      for (let c = 0; c < ncols - 1; c++) {
        if (cellEmpty[r][c] || cellEmpty[r][c + 1]) { vStr[r][c] = 1; continue; }
        const r1 = cellRar[r][c], r2 = cellRar[r][c + 1];
        if (r1 !== "Common" && r2 !== "Common" && r1 !== r2) { vStr[r][c] = 1; continue; }
        const sx = Math.round(x0 + (c + 1) * cw);
        const py0 = Math.max(0, Math.round(y0 + r * ch) + 3);
        const py1 = Math.min(H, Math.round(y0 + (r + 1) * ch) - 3);
        let allCnt = 0, topCnt = 0, tot = 0, topTot = 0;
        for (let y = py0; y < py1; y++) {
          const ro = y * W;
          let mg = 0, ms = 255;
          for (let dx = -1; dx <= 1; dx++) {
            const xi = Math.min(W - 1, Math.max(0, sx + dx));
            if (gray[ro + xi] > mg) mg = gray[ro + xi];
            if (sat[ro + xi] < ms) ms = sat[ro + xi];
          }
          const xl = Math.max(0, sx - 4), xr = Math.min(W - 1, sx + 4);
          const fl = gray[ro + xl], fr = gray[ro + xr];
          const fs = 0.5 * (sat[ro + xl] + sat[ro + xr]);
          const isR = ms < 15 && mg > 46 && mg < 78 && ((mg > fl + 2.5 && mg > fr + 2.5) || fs > ms + 7);
          if (isR) {
            allCnt++;
            if (tot < 18) topCnt++;
          }
          if (tot < 18) topTot++;
          tot++;
        }
        vStr[r][c] = Math.max(allCnt / Math.max(1, tot), 0.75 * (topCnt / Math.max(1, topTot)));
      }
    }

    for (let r = 0; r < nrows - 1; r++) {
      for (let c = 0; c < ncols; c++) {
        if (cellEmpty[r][c] || cellEmpty[r + 1][c]) { hStr[r][c] = 1; continue; }
        const r1 = cellRar[r][c], r2 = cellRar[r + 1][c];
        if (r1 !== "Common" && r2 !== "Common" && r1 !== r2) { hStr[r][c] = 1; continue; }
        const sy = Math.round(y0 + (r + 1) * ch);
        const px0 = Math.max(0, Math.round(x0 + c * cw) + 4);
        const px1 = Math.min(W, Math.round(x0 + (c + 1) * cw) - 4);
        let cnt = 0, tot = 0;
        for (let x = px0; x < px1; x++) {
          let above = 0, below = 0, mg = 0, ms = 255;
          for (let dy = -5; dy <= -3; dy++) above += gray[Math.max(0, sy + dy) * W + x];
          above /= 3;
          for (let dy = 2; dy <= 4; dy++) below += gray[Math.min(H - 1, sy + dy) * W + x];
          below /= 3;
          for (let dy = -1; dy <= 1; dy++) {
            const idx = Math.min(H - 1, Math.max(0, sy + dy)) * W + x;
            if (gray[idx] > mg) mg = gray[idx];
            if (sat[idx] < ms) ms = sat[idx];
          }
          if (below < 50 && ((mg > below + 5 && ms < 16) || above > below + 9)) cnt++;
          tot++;
        }
        hStr[r][c] = cnt / Math.max(1, tot);
      }
    }

    // 3. Connected components + valid rectangle splitting
    const TH_V = 0.22, TH_H = 0.28;
    const validShapes = new Set(["1x1", "1x2", "2x1", "2x2", "3x2", "4x2"]);
    const splitRect = (r0, c0, r1, c1) => {
      const wc = c1 - c0 + 1, hc = r1 - r0 + 1;
      if (validShapes.has(`${wc}x${hc}`)) return [{ c: c0, r: r0, wc, hc }];
      let best = -1, axis = "v", pos = c0;
      for (let c = c0; c < c1; c++) {
        let s = 0;
        for (let r = r0; r <= r1; r++) s += vStr[r][c];
        s /= hc;
        if (s > best) { best = s; axis = "v"; pos = c; }
      }
      for (let r = r0; r < r1; r++) {
        let s = 0;
        for (let c = c0; c <= c1; c++) s += hStr[r][c];
        s /= wc;
        if (s > best) { best = s; axis = "h"; pos = r; }
      }
      if (axis === "v") return [...splitRect(r0, c0, r1, pos), ...splitRect(r0, pos + 1, r1, c1)];
      return [...splitRect(r0, c0, pos, c1), ...splitRect(pos + 1, c0, r1, c1)];
    };

    const visited = Array.from({ length: nrows }, () => new Uint8Array(ncols));
    const rawBoxes = [];
    for (let r = 0; r < nrows; r++) {
      for (let c = 0; c < ncols; c++) {
        if (cellEmpty[r][c] || visited[r][c]) continue;
        const stack = [[r, c]], comp = [];
        visited[r][c] = 1;
        while (stack.length) {
          const [cr, cc] = stack.pop();
          comp.push([cr, cc]);
          if (cc + 1 < ncols && !visited[cr][cc + 1] && vStr[cr][cc] < TH_V) { visited[cr][cc + 1] = 1; stack.push([cr, cc + 1]); }
          if (cc - 1 >= 0 && !visited[cr][cc - 1] && vStr[cr][cc - 1] < TH_V) { visited[cr][cc - 1] = 1; stack.push([cr, cc - 1]); }
          if (cr + 1 < nrows && !visited[cr + 1][cc] && hStr[cr][cc] < TH_H) { visited[cr + 1][cc] = 1; stack.push([cr + 1, cc]); }
          if (cr - 1 >= 0 && !visited[cr - 1][cc] && hStr[cr - 1][cc] < TH_H) { visited[cr - 1][cc] = 1; stack.push([cr - 1, cc]); }
        }
        let r0 = nrows, r1 = -1, c0 = ncols, c1 = -1;
        for (const [cr, cc] of comp) {
          if (cr < r0) r0 = cr; if (cr > r1) r1 = cr;
          if (cc < c0) c0 = cc; if (cc > c1) c1 = cc;
        }
        const wc = c1 - c0 + 1, hc = r1 - r0 + 1;
        if (comp.length === wc * hc) {
          rawBoxes.push(...splitRect(r0, c0, r1, c1));
        } else {
          const set = new Set(comp.map(([cr, cc]) => `${cr},${cc}`));
          const used = new Set();
          comp.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
          for (const [cr, cc] of comp) {
            const k = `${cr},${cc}`;
            if (used.has(k)) continue;
            const kDn = `${cr + 1},${cc}`, kRt = `${cr},${cc + 1}`;
            if (set.has(kDn) && !used.has(kDn) && hStr[cr][cc] < TH_H) {
              used.add(k); used.add(kDn); rawBoxes.push({ c: cc, r: cr, wc: 1, hc: 2 });
            } else if (set.has(kRt) && !used.has(kRt) && vStr[cr][cc] < TH_V) {
              used.add(k); used.add(kRt); rawBoxes.push({ c: cc, r: cr, wc: 2, hc: 1 });
            } else {
              used.add(k); rawBoxes.push({ c: cc, r: cr, wc: 1, hc: 1 });
            }
          }
        }
      }
    }

    // 4. Match-guided split refinement
    const refined = [];
    for (const b of rawBoxes) {
      const m = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, b.wc, b.hc);
      if (b.wc === 2 && b.hc === 2 && m.score < 0.65) {
        const a1 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 1, 2);
        const a2 = this.scoreCrop(canvas, W, H, data, grid, b.c + 1, b.r, 1, 2);
        const b1 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 2, 1);
        const b2 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r + 1, 2, 1);
        const vAvg = 0.5 * (a1.score + a2.score);
        const hAvg = 0.5 * (b1.score + b2.score);
        if (Math.max(vAvg, hAvg) > m.score + 0.16) {
          if (vAvg >= hAvg) {
            refined.push({ c: b.c, r: b.r, wc: 1, hc: 2, ...a1 });
            refined.push({ c: b.c + 1, r: b.r, wc: 1, hc: 2, ...a2 });
          } else {
            refined.push({ c: b.c, r: b.r, wc: 2, hc: 1, ...b1 });
            refined.push({ c: b.c, r: b.r + 1, wc: 2, hc: 1, ...b2 });
          }
          continue;
        }
      } else if (b.wc === 2 && b.hc === 1 && m.score < 0.58) {
        const a1 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 1, 1);
        const a2 = this.scoreCrop(canvas, W, H, data, grid, b.c + 1, b.r, 1, 1);
        if (0.5 * (a1.score + a2.score) > m.score + 0.14) {
          refined.push({ c: b.c, r: b.r, wc: 1, hc: 1, ...a1 });
          refined.push({ c: b.c + 1, r: b.r, wc: 1, hc: 1, ...a2 });
          continue;
        }
      } else if (b.wc === 1 && b.hc === 2 && m.score < 0.58) {
        const a1 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 1, 1);
        const a2 = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r + 1, 1, 1);
        if (0.5 * (a1.score + a2.score) > m.score + 0.14) {
          refined.push({ c: b.c, r: b.r, wc: 1, hc: 1, ...a1 });
          refined.push({ c: b.c, r: b.r + 1, wc: 1, hc: 1, ...a2 });
          continue;
        }
      }
      refined.push({ ...b, ...m });
    }

    // 5. Greedy best-gain-first merge refinement for split 1x1s -> 1x2 or 2x1
    const byCR = new Map();
    refined.forEach((b, idx) => {
      if (b.wc === 1 && b.hc === 1) byCR.set(`${b.c},${b.r}`, idx);
    });
    const mergeCands = [];
    refined.forEach((b, i) => {
      if (b.wc !== 1 || b.hc !== 1 || b.score >= 0.70) return;
      const dn = byCR.get(`${b.c},${b.r + 1}`);
      if (dn != null) {
        const mRes = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 1, 2);
        const gain = mRes.score - 0.5 * (b.score + refined[dn].score);
        if (gain > 0.20 && mRes.score > 0.52) {
          mergeCands.push({ gain, i, j: dn, box: { c: b.c, r: b.r, wc: 1, hc: 2, ...mRes } });
        }
      }
      const rt = byCR.get(`${b.c + 1},${b.r}`);
      if (rt != null) {
        const mRes = this.scoreCrop(canvas, W, H, data, grid, b.c, b.r, 2, 1);
        const gain = mRes.score - 0.5 * (b.score + refined[rt].score);
        if (gain > 0.20 && mRes.score > 0.52) {
          mergeCands.push({ gain, i, j: rt, box: { c: b.c, r: b.r, wc: 2, hc: 1, ...mRes } });
        }
      }
    });
    mergeCands.sort((a, b) => b.gain - a.gain);
    const mergedIdx = new Set();
    const finalBoxes = [];
    for (const mc of mergeCands) {
      if (mergedIdx.has(mc.i) || mergedIdx.has(mc.j)) continue;
      mergedIdx.add(mc.i);
      mergedIdx.add(mc.j);
      finalBoxes.push(mc.box);
    }
    refined.forEach((b, i) => {
      if (!mergedIdx.has(i)) finalBoxes.push(b);
    });

    finalBoxes.sort((a, b) => a.r - b.r || a.c - b.c);

    // Attach pixel boxes & unique slot ids
    const slots = finalBoxes.map((b, idx) => ({
      slotId: idx,
      c: b.c,
      r: b.r,
      wc: b.wc,
      hc: b.hc,
      px0: Math.round(x0 + b.c * cw) + 2,
      py0: Math.round(y0 + b.r * ch) + 2,
      px1: Math.round(x0 + (b.c + b.wc) * cw) - 2,
      py1: Math.round(y0 + (b.r + b.hc) * ch) - 2,
      item: b.item,
      score: b.score,
      rarity: b.rarity,
      hasBar: b.hasBar,
      top5: b.top5,
      manual: false,
    }));

    return {
      width: W,
      height: H,
      grid: { x0, y0, cw, ch, ncols, nrows },
      slots,
    };
  }
}

function quickMedian(arr, len) {
  const s = Array.from(arr.subarray(0, len)).sort((a, b) => a - b);
  return s[Math.floor(len / 2)] ?? 0;
}

function quickPercentile(arr, len, p) {
  const s = Array.from(arr.subarray(0, len)).sort((a, b) => a - b);
  return s[Math.min(len - 1, Math.floor(len * p))] ?? 0;
}

// Evaluate verdict for an item given enabled collection tiers
export function evaluateItem(item, enabledTiers, t, lang) {
  if (!item) {
    return { status: "SELL", badge: "?", verdict: t.verdictSell, activeCols: [], disabledCols: [] };
  }
  const activeCols = (item.cols || []).filter((c) => enabledTiers[c.group]);
  const disabledCols = (item.cols || []).filter((c) => !enabledTiers[c.group]);

  // Special non-collection keep items (Filling, Keys, Tools, Barters, Raid)
  if (item.role === "filling") {
    const isBank = item.en.toLowerCase().includes("deposit box");
    const isBarter = Boolean(item.barter);
    return {
      status: "KEEP",
      badge: isBank ? t.badgeBank : isBarter ? t.badgeFillBarter : t.badgeFill,
      verdict: t.verdictKeepFill,
      activeCols,
      disabledCols,
    };
  }
  if (item.role === "key") {
    return { status: "KEEP", badge: t.badgeKey, verdict: t.verdictKeepKey, activeCols, disabledCols };
  }
  if (item.role === "tool") {
    return { status: "KEEP", badge: t.badgeSafe, verdict: t.verdictKeepTool, activeCols, disabledCols };
  }
  if (item.role === "barter") {
    return { status: "KEEP", badge: t.badgeBarter, verdict: t.verdictKeepBarter, activeCols, disabledCols };
  }
  if (item.role === "raid") {
    return { status: "KEEP", badge: t.badgeRaid, verdict: t.verdictKeepRaid, activeCols, disabledCols };
  }

  // Utility / Gear / Casino
  if (item.role === "casino") {
    return { status: "UTIL", badge: t.badgeCasino, verdict: t.verdictCasino, activeCols, disabledCols };
  }
  if (["weapon", "armor", "ammo", "grenade", "bag", "meds", "crypto"].includes(item.role)) {
    const map = {
      weapon: t.badgeGun,
      armor: t.badgeArmor,
      ammo: t.badgeAmmo,
      grenade: t.badgeNade,
      bag: t.badgeBag,
      meds: t.badgeMeds,
      crypto: t.badgeCrypto,
    };
    return { status: "UTIL", badge: map[item.role], verdict: t.verdictUtil, activeCols, disabledCols };
  }

  // Collection items
  if (activeCols.length > 0) {
    const prefixMap = lang === "de"
      ? { Basic: "G", Additional: "Z", Special: "B", Unique: "E" }
      : { Basic: "B", Additional: "A", Special: "S", Unique: "U" };
    const codes = activeCols.map((c) => `${prefixMap[c.group]}${c.slug.split("-")[1]}`);
    return {
      status: "KEEP",
      badge: codes.slice(0, 2).join("/"),
      verdict: t.verdictKeepCol,
      activeCols,
      disabledCols,
    };
  }

  return {
    status: "SELL",
    badge: t.badgeSell,
    verdict: t.verdictSell,
    activeCols: [],
    disabledCols,
  };
}
