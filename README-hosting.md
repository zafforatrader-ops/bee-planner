# Get Bee live on a free website (5 minutes)

Everything is prepared. You only do the drag-and-drop — I can't log into your account for you.

## Deploy folder
`~/Desktop/Bee-weeklyplanner/site/`  (also zipped as `bee-site.zip`)

Contains: `index.html`, `manifest.webmanifest`, `sw.js`, `icon.svg`.

## Fastest path — Netlify Drop (no credit card, free forever tier)
1. Open **https://app.netlify.com/drop** in your browser.
2. Drag the **`site`** folder (the whole folder) onto the drop area.
   - It deploys instantly and gives you a URL like `https://something-random.netlify.app`.
3. Click **"Sign up"** (Google/GitHub/email) to *claim & keep* the site — otherwise the temp deploy expires.
4. In **Site settings → Change site name**, rename it to e.g. `bee-planner` → `https://bee-planner.netlify.app`.
5. Open that URL on your iPhone/iPad → **Share → Add to Home Screen**. Done — a real installable app.

## Alternative — Cloudflare Pages
Dashboard → Workers & Pages → Create → Pages → **Upload assets** → drop the `site` folder.

## To update the site later
After I change the app, I re-run `bash build-site.sh`, then you drag the new `site` folder to Netlify again (or connect it to a Git repo for auto-deploy — we can set that up later).

## Next: Sunday email digest
Once the site is live, send me the URL. For weekly emails we'll add a tiny scheduled function + a free email service (e.g. Resend). You'll create that free account and paste its API key into the host — never to me.
