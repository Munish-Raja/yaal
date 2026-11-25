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
3. Go back to the sheet. You'll see a new **Setup** tab with your **Shop key** (a long code). You'll also see the tabs **Products**, **Sales**, **Purchases** and **App Settings**.

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

## How syncing works

- Every change is saved on the phone first, then uploaded to the sheet within a few seconds.
- **No internet?** Billing keeps working. The top bar shows "Offline · 3 waiting", and the changes upload automatically when you're back online.
- Other phones pick up changes every 20 seconds, and whenever the app is opened. Tap **Sync now** in Settings to update straight away.
- If two phones create a bill with the same invoice number while one is offline, the second one is renumbered automatically (for example INV-0008 → INV-0009). The app shows a message when this happens.

## Using the sheet

- Each tab has readable columns that you can filter, sort, print or download (**File → Download → Microsoft Excel**).
- The hidden columns **Rev** and **Data (do not edit)** are what the app reads. **Make changes in the app, not by typing in the sheet.** Edits typed into the sheet are not picked up by the app.
- Don't rename the tabs or delete the hidden `_deleted` tab.

## Changing the key (if a phone is lost or someone leaves)

1. In Apps Script, run **`resetKey`**. The Setup tab shows the new key.
2. On each phone you still use: go to **Settings → Disconnect**, then connect again with the new key (or send a fresh staff link).

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
