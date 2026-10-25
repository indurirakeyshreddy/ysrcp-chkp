# YSRCP CHKP campaign website

A bilingual, responsive static website for the YSRCP MPTC campaign in CHKP Village. The gallery is public once this site and its media files are deployed to a public web host.

## Add campaign photos and videos

1. Put the files in the `media` folder. For example, `media/door-to-door.jpg` or `media/campaign-meeting.mp4`.
2. Open `media.js` and add an entry to `window.campaignMedia`:

   ```js
   { type: "image", src: "media/door-to-door.jpg", date: "25 Oct 2026", title: "Campaign visit", titleTe: "ప్రచార పర్యటన" },
   ```

   For a video, set `type` to `"video"` and use a browser-supported video file such as `.mp4`. Telugu titles are optional; if omitted, the English title is used.
3. Save the changes and deploy the updated site and media files to your public web host. The media will then be visible to everyone.

This static starter does not include an upload dashboard or public visitor submissions. Add only media you have permission to publish. Replace `REDDY` in `index.html` if you want to show the candidate's full name.
