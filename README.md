# YAAL Stock & Billing

A simple billing and stock app for small clothing shops (sarees, chudithar sets, kurtis, dupattas and more). It runs in the phone's browser, installs to the home screen like an app, works **offline**, and needs **no sign-in**.

Data is stored in **your own Google Sheet** (cloud), so every phone shares the same stock and bills. Each phone also keeps a copy, so billing works without internet and syncs when the phone is back online. Setup takes about 10 minutes: see **[SETUP-GOOGLE-SHEET.md](SETUP-GOOGLE-SHEET.md)**.

---

## Features

- **New bill**: search products, add them to a bill, set quantity and discount % per item, enter customer name and phone, payment mode and sales channel.
  - Invoice numbers are created automatically (e.g. `INV-0007`).
  - Warns you when you bill more than you have in stock.
  - Shows a printable-style bill, with **Send on WhatsApp** and **Copy bill text**.
- **Stock**
  - Product list with *In stock / Low / Out of stock* labels, search, and category and stock filters.
  - Product codes (SKUs) are created automatically from the category (e.g. `SAR-004`, `KUR-012`).
  - **Stock in (purchases)**: record new stock from suppliers, with supplier name, bill number and payment status (Paid / Partly Paid / Pending).
  - Current stock = opening stock + stock in − units sold.
- **Bills**: bill history by month, search by customer, phone or invoice number, and monthly sales and profit totals. Deleting a bill puts its items back into stock.
- **Home**: today's sales, this month's sales and profit, stock value, low-stock count, last 6 months, items to restock, top sellers and sales by category.
- **GST (India)**
  - Can be turned on or off (off by default for shops that are not GST-registered).
  - Prices can include GST (MRP style) or have GST added on top.
  - Apparel uses a per-piece price slab: 5% up to ₹2,500 and 18% above, per the GST changes of 22 Sep 2025.
  - Categories marked **Flat** (e.g. sarees, unstitched material) always use the fabric rate (5%).
  - Bills split GST into CGST and SGST.
  - All rates can be edited in Settings. Please confirm HSN-wise rates with your CA.
- **Excel**
  - **Download Excel** exports Inventory, Sales and Purchases sheets as `.xlsx`.
  - **Import products** reads the `Inventory` sheet of the companion Excel workbook, or any sheet with a "Product Name" column.
- **Cloud storage in Google Sheets**: data goes to a Google Sheet in your Drive through a small Apps Script web app. Staff connect with a one-tap link, with no accounts.
  - Changes are saved on the phone instantly and upload in the background.
  - Works offline: changes wait on the phone and upload later.
  - Other phones update every 20 seconds.
  - Invoice number clashes between phones are fixed automatically.
- **Backup & restore**: one `.json` file holds all your data.
- **Settings**: shop name, address, phone, GSTIN, invoice prefix, bill footer, default reorder level, and your own categories, sizes, payment modes and sales channels.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS and JavaScript in one file) |
| `google-sheet/Code.gs` | Google Apps Script that stores the data in your Google Sheet |
| `SETUP-GOOGLE-SHEET.md` | Step-by-step cloud setup |
| `manifest.webmanifest` | App name, colours and icons, so Chrome can install it |
| `sw.js` | Service worker: caches the app so it opens offline |
| `xlsx.full.min.js` | [SheetJS](https://sheetjs.com/) 0.18.5, used for Excel export and import, bundled so it works offline |
| `logo.png` | YAAL logo (header and bills) |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | App icons (made from the logo) |

There is no build step and there are no dependencies to install.

## Deploy with GitHub Pages (free)

1. Create a new repository on GitHub (it can be public or private on a paid plan; Pages on private repos needs GitHub Pro).
2. Upload all the files above to the root of the repository (**Add file → Upload files**), then commit.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and click **Save**.
5. After a minute or two, your app is live at:
   `https://<your-username>.github.io/<repository-name>/`

Or from the command line:

```bash
git init
git add .
git commit -m "Boutique Stock & Billing app"
git branch -M main
git remote add origin https://github.com/<your-username>/<repository-name>.git
git push -u origin main
```

Then turn on Pages as in steps 3 and 4.

> The app must be served over **HTTPS** (GitHub Pages does this) for installing and offline use to work. Opening `index.html` directly from a file will run the app, but it won't install or work offline.

## Install on Android

1. Open your GitHub Pages link in **Chrome**.
2. Tap **Install app**, or **⋮ → Add to Home screen**.
3. Open it from the new ₹ icon. After the first visit, it works without internet.

To get an actual `.apk` / Play Store package, paste your GitHub Pages link into [PWABuilder](https://www.pwabuilder.com/) and choose **Android**.

## Your data

- **With the Google Sheet connected** (recommended), the sheet is the main copy and every phone syncs with it. A lost or reset phone loses nothing: connect a new phone with the staff link.
- **Without it**, data lives only in the browser on that phone. Clearing Chrome's site data deletes it, so make regular backups (**Settings → Make backup**).
- The shop key and staff link work like a password. Share them only with people you trust. To lock out a phone, run `resetKey` (see the setup guide).
- No shop data is stored in this GitHub repository.
- The app starts with sample products and bills so you can try it. Remove them in **Settings → Remove sample data** before real use. If you connect the sheet first, the samples are copied into it too, so remove them from any phone and the removal syncs to every phone.

## Updating the app

Edit `index.html`, commit and push. Phones pick up the new version the next time the app is opened with internet.

If you change any file other than `index.html` (for example the icons or `xlsx.full.min.js`), also change the cache name in `sw.js` (e.g. `boutique-v2` → `boutique-v3`) so phones download the new files.

If you change `google-sheet/Code.gs`, paste it into Apps Script and deploy a **New version** (see the setup guide).

Your data is not affected by updates.

## Tech notes

- Plain HTML, CSS and JavaScript, with no framework.
- Phone storage: IndexedDB database `boutique-stock` (a `docs` copy plus an outbox of changes not yet uploaded), with a `localStorage` fallback.
- Cloud: Google Apps Script web app (`google-sheet/Code.gs`). Requests are plain `POST`s with a JSON body and the shop key, using the actions `load` (changes since a revision number), `batch` (puts and deletes) and `replaceAll`. Each record is one sheet row: readable columns, plus hidden `Rev` and JSON `Data` columns. Deletions are logged in a hidden `_deleted` tab.
- Data layout: `config/settings`, `products/<SKU>`, `sales/<invoice>` (one document per bill, items inside), `purchases/<id>`.
- Fonts: Hind and Yatra One from Google Fonts. If they can't load offline, system fonts are used instead.

## Disclaimer

GST rates and rules in this app are provided for convenience and may change. Check with a qualified tax professional before relying on them for filing.

## License

Free to use and modify for your business.
