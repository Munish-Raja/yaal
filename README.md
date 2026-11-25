# Boutique Stock & Billing

A simple billing and stock app for small clothing shops (sarees, chudithar sets, kurtis, dupattas and more). It runs in the phone's browser, installs to the home screen like an app, works **offline**, and needs **no sign-in**.

All data is stored **on the device** (in the browser's IndexedDB). Nothing is sent to a server.

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
- **Backup & restore**: one `.json` file holds all your data. Restore it on the same phone or a new one.
- **Settings**: shop name, address, phone, GSTIN, invoice prefix, bill footer, default reorder level, and your own categories, sizes, payment modes and sales channels.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS and JavaScript in one file) |
| `manifest.webmanifest` | App name, colours and icons, so Chrome can install it |
| `sw.js` | Service worker: caches the app so it opens offline |
| `xlsx.full.min.js` | [SheetJS](https://sheetjs.com/) 0.18.5, used for Excel export and import, bundled so it works offline |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | App icons |

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

- Data lives **only in the browser on that device**. It is not synced between phones.
- Clearing Chrome's site data, or uninstalling Chrome, deletes it.
- **Make a backup every week** (Settings → Make backup) and save the file somewhere safe (Google Drive, email, WhatsApp to yourself).
- To move to a new phone: make a backup on the old phone, install the app on the new one, then use **Restore backup**.
- The app starts with sample products and bills so you can try it. Remove them in **Settings → Remove sample data** before real use.

## Updating the app

Edit `index.html`, commit and push. Phones pick up the new version the next time the app is opened with internet.

If you change any file other than `index.html` (for example the icons or `xlsx.full.min.js`), also change the cache name in `sw.js` (e.g. `boutique-v1` → `boutique-v2`) so phones download the new files.

Your data is not affected by updates.

## Tech notes

- Plain HTML, CSS and JavaScript, with no framework.
- Storage: IndexedDB database `boutique-stock`, with a `localStorage` fallback.
- Data layout: `config/settings`, `products/<SKU>`, `sales/<invoice>` (one document per bill, items inside), `purchases/<id>`.
- Fonts: Hind and Yatra One from Google Fonts. If they can't load offline, system fonts are used instead.

## Disclaimer

GST rates and rules in this app are provided for convenience and may change. Check with a qualified tax professional before relying on them for filing.

## License

Free to use and modify for your business.
