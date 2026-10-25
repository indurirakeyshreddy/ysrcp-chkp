# YSRCP CHKP election campaigns

A bilingual, responsive static website with separate campaign pages for MPTC, ZPTC, Panchayat, MLA and MP elections. The root URL opens the election selected as active in the YAML configuration; there is no separate campaign hub. Each campaign page has its own photo/video gallery. The gallery becomes public after the updated site and media files are deployed to a public web host.

Links shared from the root or campaign pages use `share-card.png` as their Open Graph and social-card preview. Keep the image available at the public GitHub repository URL used in each page's metadata.

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
3. Use `electionOrder` to change the menu order and update each election's `label` in English (`en`) and Telugu (`te`) to change its menu name. Telugu labels are Panchayat `పంచాయతీ`, MPTC `మండల పరిషత్ ప్రాదేశిక నియోజకవర్గం`, ZPTC `జిల్లా పరిషత్ ప్రాదేశిక నియోజకవర్గం`, MLA `శాసనసభ`, and MP `పార్లమెంటు`.
4. `activeElection` controls the campaign opened at the site root; `enabled` independently controls whether that campaign link appears in the header.

The selected election page is the site's home page; the root URL reads `activeElection` from the YAML and redirects to that page. The election menu also reads its order, enabled flags, and bilingual labels directly from YAML, without requiring a third-party YAML library. Serve the site over HTTP (for example, with VS Code Live Server), not directly as a `file://` page. This file-based setting is not an online admin dashboard; changes appear publicly after deployment.

Campaign pages remain available by their folder URLs even when hidden from the Elections menu.

## Add campaign photos and videos

1. Put MPTC campaign files in `mptc/mptc-media/`, grouped into folders such as `fans`, `new-joinees`, and `procession-rally`.
2. Open `media.js` and add each item to the matching election's array in `window.campaignMediaByElection`:

   ```js
   mptc: [
     { type: "image", src: "mptc/mptc-media/fans/fan-1.jpeg", title: "Campaign supporters", titleTe: "ప్రచార మద్దతుదారులు" },
     { type: "video", src: "mptc/mptc-media/procession-rally/procession-rally.mp4", title: "Campaign procession", titleTe: "ప్రచార ఊరేగింపు" },
   ],
   ```

   Use `type: "video"` for a browser-supported video such as `.mp4`. Gallery photos appear before videos. Videos autoplay muted when visible; double-click a video to toggle sound, or use its player controls. Add entries to `zptc`, `panchayat`, `mla`, or `mp` for those campaign galleries. Telugu titles are optional.
3. Save the changes and deploy the updated site and media files to your public web host.

This static site does not include an upload dashboard or visitor submissions. Add only media you have permission to publish. Update the candidate details on the relevant page after they are confirmed.
