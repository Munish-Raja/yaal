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
- **Product photos**: take a photo (or pick one from the gallery) when adding or editing a product. Photos show on the product screen and as thumbnails in the stock list and bill search. With the Google Sheet connected, they're saved privately in your Google Drive (folder *YAAL Product Photos*) and appear on every phone. Each phone keeps a copy so photos open quickly, even offline.
- **Barcodes**
  - Every product gets a Code 128 barcode of its SKU, shown on the product screen.
  - **Barcode labels** (Stock screen) makes a PDF to print: A4 sticker sheets (24 or 40 labels) or label-printer rolls (50×25 or 38×25 mm). Each label has the shop name, product, size, colour, price and barcode.
  - **Scan** on the New bill screen uses the phone camera; every scanned item is added to the bill. USB or Bluetooth barcode scanners also work: they type into the search box and press Enter.
  - Scanning an invoice barcode (printed on every PDF bill) opens that bill.
- **Logins and team**: everyone logs in with their own username and password, with fingerprint (or face) unlock on phones that support it. The owner adds staff in Settings → Team, with employee details (phone, designation, joining date, address, emergency contact, ID, bank/UPI). Bills, stock entries and expenses record who created and last edited them. Staff can bill, add stock and expenses, and change only what they created; only the owner can change shop settings, manage users and delete bills.
- **Expenses**: record every business expense with a category, who paid, payment mode and a note. Categories, people and payment modes are set in Settings → Expenses.
- **Split expenses** (like GPay / PhonePe): split equally, by amounts or by percent between partners. The app shows who owes whom and records settlements. Settlements are not counted as expenses.
- **Dashboard**: net profit (income − expenses) for this month, last month, 3 months, this financial year or all time, with charts for income vs expenses, daily sales, expenses by category, sales by category, payment modes, channels and partner balances.
- **PDF bills**: send straight to the customer's WhatsApp chat as a PDF link, share the PDF file through the share menu, or download it to the phone.
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
| `jspdf.min.js` | [jsPDF](https://github.com/parallax/jsPDF) 2.5.2, makes PDF bills and label sheets |
| `jsbarcode.min.js` | [JsBarcode](https://github.com/lindell/JsBarcode) 3.11.6, draws barcodes |
| `zxing.min.js` | [ZXing](https://github.com/zxing-js/library) 0.21.3, reads barcodes from the camera on phones without built-in barcode detection |
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

## Barcodes and labels: tips

- Print label PDFs at **100% / Actual size** (not "Fit to page") so they line up with the sticker sheet.
- For a label printer, set the paper size in the printer settings to match the label (50×25 or 38×25 mm).
- The camera needs the app to be opened from its `https://` link (GitHub Pages is fine). Allow camera access when Chrome asks.
- Each scan adds one piece. To add a second piece of the same item, move the camera away and scan again, or tap **+** on the bill.
- **WhatsApp** opens the customer's own chat (from the phone number on the bill) with the bill and a link to its PDF, saved in the Drive folder *YAAL Bills*. You only tap Send. It needs the cloud connected and script version 5. **Share PDF…** still sends the PDF file itself through the phone's share menu, where you pick the chat.

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
