# Rob Run — Loot Appraisal & Collection Scanner

100% client-side static web app for **Rob Run** (Kefir). Paste (`Ctrl+V`) or drag-and-drop one or multiple storage screenshots (PNG, JPG, WEBP, GIF, BMP, AVIF) to instantly mark:

- **Green (`SELL`)** — Safe to sell directly to the Fence (not used in any enabled collection, barter, or safe).
- **Red (`KEEP`)** — Used in any of the **34 Collection recipes** (Basic, Additional, Special, Unique), **Filling/Barter items** (Cargo Sheet, Action Camera, USB Hacking Tool, Deposit Box Keys, Evidence), **Safe/Heist tools**, or **Keys/Raid gear**.
- **Yellow (`GEAR / CHIPS`)** — Weapons, armor, ammo, bags, grenades, meds, and **Casino Poker Chips** (cash out at the Casino, not the Fence).

## Features
- **Zero backend / $0 hosting** — runs 100% locally in the browser; screenshots never leave your PC.
- **Single or multi-storage sessions** — upload multiple containers and see **Ready to Pack** and **1 Item Away** collections across all tabs.
- **Interactive Hover Tooltips** — icon, rarity, Fence sell price, Full price, barter notes, and live collection checklists.
- **Click-to-Verify / Override** — inspect top 5 visual matches or manually fix any cell.
- **Collection Tier Toggles** — turn off tiers you aren't chasing (e.g. Unique Tier III) to immediately flip those items to `SELL`.
- **English (`EN`) & German (`DE`)** switcher.
- **Export / Copy Marked PNG** — one-click copy to paste straight into Discord.

## Deploy Free on GitHub Pages (3 Steps)
1. Create a new GitHub repository (e.g. `robrun-loot-scanner`) and push this folder's contents to the `main` branch.
2. Open **Settings → Pages** in your GitHub repo.
3. Under **Build and deployment**, choose **Deploy from a branch** → Branch **`main`** / folder **`/ (root)`** → **Save**.

Within ~30 seconds your shareable link (`https://<your-username>.github.io/robrun-loot-scanner/`) will be live!

## Local Preview
```bash
python3 -m http.server 8765
# Open http://localhost:8765
```
