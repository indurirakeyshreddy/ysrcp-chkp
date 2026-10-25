# YSRCP CHKP election campaigns

A bilingual, responsive static website with separate campaign pages for MPTC, ZPTC, Panchayat, MLA and MP elections. The root URL opens the election selected as active in the YAML configuration; there is no separate campaign hub. Each campaign page has its own photo/video gallery. The gallery becomes public after the updated site and media files are deployed to a public web host.

## Campaign pages

Each election has a separate folder and `index.html` page:

- `mptc/` — MPTC campaign (CHKP candidate REDDY)
- `zptc/` — ZPTC campaign
- `panchayat/` — Gram Panchayat campaign
- `mla/` — Assembly campaign
- `mp/` — Parliament campaign

Candidate names and details on the ZPTC, Panchayat, MLA and MP pages are intentionally placeholders until confirmed.

## Choose the active campaign

Edit `campaign-config.yaml` before publishing:

1. Set `activeElection` to `mptc`, `zptc`, `panchayat`, `mla`, or `mp`. Visiting the root URL opens that election's campaign page directly.
2. Set an election's `enabled` value to `1` to show its campaign button under the Elections heading, or `0` to hide it.
3. Use `electionOrder` to change the menu order and update each election's `label` in English (`en`) and Telugu (`te`) to change its menu name.
4. `activeElection` controls the campaign opened at the site root; `enabled` independently controls whether that campaign link appears in the header.

The selected election page is the site's home page; the root URL reads `activeElection` from the YAML and redirects to that page. The election menu also reads its order, enabled flags, and bilingual labels directly from YAML, without requiring a third-party YAML library. Serve the site over HTTP (for example, with VS Code Live Server), not directly as a `file://` page. This file-based setting is not an online admin dashboard; changes appear publicly after deployment.

Campaign pages remain available by their folder URLs even when hidden from the Elections menu.

## Add campaign photos and videos

1. Put the files in a root-level `media` folder, using election-specific names such as `media/zptc-meeting.mp4`.
2. Open `media.js` and add each item to the matching election's array in `window.campaignMediaByElection`:

   ```js
   mptc: [
     { type: "image", src: "media/mptc-door-to-door.jpg", date: "25 Oct 2026", title: "Campaign visit", titleTe: "ప్రచార పర్యటన" },
   ],
   ```

   Use `type: "video"` for a browser-supported video such as `.mp4`. Add the entry to `zptc`, `panchayat`, `mla`, or `mp` for that campaign's gallery. Telugu titles are optional.
3. Save the changes and deploy the updated site and media files to your public web host.

This static site does not include an upload dashboard or visitor submissions. Add only media you have permission to publish. Update the candidate details on the relevant page after they are confirmed.
