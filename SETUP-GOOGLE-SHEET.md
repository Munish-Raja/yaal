# Store your shop data in a Google Sheet

This connects the app to a Google Sheet in **your** Google Drive. You set it up once, on a computer, in about 10 minutes. After that, you and your staff use the app with **no sign-in**, and every phone shares the same products, stock and bills.

You need a Google (Gmail) account. Only you use it, and only for this setup.

---

## 1. Create the sheet

1. Go to [sheets.new](https://sheets.new) (this creates a blank Google Sheet).
2. Name it, for example **Boutique Shop Data**.

## 2. Add the script

1. In the sheet, open **Extensions → Apps Script**.
2. Delete everything in the editor, then paste the whole contents of [`google-sheet/Code.gs`](google-sheet/Code.gs) from this repository.
3. Click **Save** (the disk icon).

## 3. Run setup once

1. In the toolbar's function dropdown, choose **`setup`**, then click **Run**.
2. Google asks for permission:
   - Click **Review permissions** and choose your account.
   - You may see **"Google hasn't verified this app"**. That's normal for your own scripts. Click **Advanced → Go to (your project name) (unsafe) → Allow**.
3. Google also asks for **Google Drive** permission. This is for product photos, which are saved in a private Drive folder called *YAAL Product Photos*.
4. Go back to the sheet. You'll see a new **Setup** tab with your **Shop key** (a long code). You'll also see the tabs **Products**, **Sales**, **Purchases** and **App Settings**.

## 4. Publish it as a web app

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
4. Click **Deploy**, and allow access again if asked.
5. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy…/exec`.

## 5. Connect the app

1. Open the app on your phone and go to **Settings → Cloud storage (Google Sheet)**.
2. Paste the **Web app URL** and the **Shop key**, then tap **Connect**.
   - If the sheet is empty, everything already on your phone is copied into it.
   - If the sheet already has data, the phone switches to the sheet's data.
3. The top bar shows **Cloud ✓** when connected.

## 6. Add staff phones

On your connected phone, go to **Settings → Send staff link on WhatsApp** (or **Copy staff link**). When staff open that link on their phone, it connects in one tap. They can then install the app from Chrome (**Install app**).

> Treat the staff link and shop key like a password. Anyone who has them can see and change your shop data.

---

## Product photos

Photos you take in the app are saved in a Google Drive folder called **YAAL Product Photos**, in the same Google account as the sheet. The folder stays private. The app loads photos through your script, so they're never shared publicly. The sheet only stores a short reference to each photo.

**Already set up the sheet before photos were added?** Update the script once:
1. Paste the new `google-sheet/Code.gs` over the old code in Apps Script and click **Save**.
2. Choose **`setup`** and click **Run**. Google asks for one new permission, **Google Drive**. Allow it; this creates the photo folder.
3. Go to **Deploy → Manage deployments → ✏️ Edit**, set **Version: New version**, then click **Deploy**. The URL stays the same, so phones don't need to reconnect.

Until you do this, photos stay on the phone they were taken on, and upload automatically after the update.

## How syncing works

- Every change is saved on the phone first, then uploaded to the sheet within a few seconds.
- **No internet?** Billing keeps working. The top bar shows "Offline · 3 waiting", and the changes upload automatically when you're back online.
- Other phones pick up changes every 20 seconds, and whenever the app is opened. Tap **Sync now** in Settings to update straight away.
- If two phones create a bill with the same invoice number while one is offline, the second one is renumbered automatically (for example INV-0008 → INV-0009). The app shows a message when this happens.

## Using the sheet

- Each tab has readable columns that you can filter, sort, print or download (**File → Download → Microsoft Excel**).
- **You can edit the sheet directly.** Change any visible cell (a customer name, a price, a date, a bill total), type a new row, or delete a row. The phones pick it up within about 10 seconds.
  - To add a product in the sheet, fill a new row in **Products** with at least the **SKU** and **Product Name**.
  - To add a stock entry, fill a new row in **Purchases**. The ID is created for you.
  - Bills typed into **Sales** show in the app with their total, but have no item lines, so they don't change stock. For a sale that should reduce stock, make the bill in the app.
  - Changing **Pieces** or **Bill Total** of an existing bill changes the bill's totals only. The items inside the bill (and so the stock) stay as they were. To fix the items, delete the bill and make it again in the app.
- Don't type in the hidden **Rev** and **Data (do not edit)** columns. The script keeps them up to date for you.
- Don't rename the tabs or delete the hidden `_deleted` tab.

## Changing the key (if a phone is lost or someone leaves)

1. In Apps Script, run **`resetKey`**. The Setup tab shows the new key.
2. On each phone you still use: go to **Settings → Disconnect**, then connect again with the new key (or send a fresh staff link).

## Script updated for sheet editing (version 4)

If you set up the sheet before sheet editing was supported, update the script once:
1. Paste the new `Code.gs`, click **Save**, choose **`setup`** and click **Run**. Allow the new permission; it lets the script notice deleted rows.
2. Go to **Deploy → Manage deployments → ✏️ Edit**, set **Version** to **New version**, and click **Deploy**.

In the app, **Settings → Sync details** should then show *Sheet script: version 4 ✓*.

## Script updated for WhatsApp bills (version 5)

Version 5 lets **WhatsApp to customer** open the customer's own chat with the bill PDF link already in the message. To get it:

1. Open the sheet, then **Extensions → Apps Script**, and replace all the code with the new `Code.gs`. Click **Save**.
2. Click **Deploy → Manage deployments**, then the pencil (Edit), set **Version** to **New version**, and click **Deploy**. The web app address stays the same.

Bill PDFs are saved in a Drive folder called **YAAL Bills**. Each one can be opened by anyone who has its link, so only the customer you send it to can see it. If your Google account is a work account that blocks link sharing, the app tells you, and you can use **Share PDF…** instead.

## Updating the script later

If you paste a newer `Code.gs`, go to **Deploy → Manage deployments → ✏️ Edit**. Set **Version** to **New version**, then click **Deploy**. The Web app URL stays the same, so phones don't need to reconnect.

## Limits

- Google's free Apps Script limits are well above what a small shop needs.
- Each save takes 1–2 seconds to reach the sheet, but the app never waits for it.
- A Google Sheet holds up to 10 million cells, which is enough for many years of bills.

## Troubleshooting

| What you see | What to do |
|---|---|
| "Could not reach the Google Sheet" | Check that the URL ends in `/exec` and that **Who has access** is **Anyone**. Then try again with internet. |
| "Shop key is wrong" | Copy the key again from the **Setup** tab. Watch out for missing characters or extra spaces. |
| Top bar says "Key wrong" | The key was reset. Disconnect and connect again with the new key. |
| Changes not showing on another phone | Tap **Settings → Sync now** on both phones. |
| You changed `Code.gs` but nothing changed | Deploy a **New version** (see "Updating the script later"). |
