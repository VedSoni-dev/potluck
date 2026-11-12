# Potluck

A shared space where your group drops links and notes, then asks an AI to build the planning tools you need: polls, itineraries, expense splits, brackets, drag-and-drop seating charts. A free, open-source alternative to Google Tabletop.

Open it and you land in a sample space ("Tahoe ski weekend", 6 friends) where every tool already works: vote, split, advance the bracket, drag name badges between rooms. No account, no key needed.

## What works

- **A space for the group**: editable title and details, a people list (tap a name to act as them), and a board of links and notes.
- **Six real tools**, all editable in place:
  - **Poll**: one tap to vote, live bars, voter avatars, leader marked, add options.
  - **Expense split**: log who paid and who shares it; it works out who owes whom, to the cent, with at most one payment fewer than there are people.
  - **Seating chart**: tables or rooms with seat counts; drag name badges between them (mouse or touch), or tap a badge then tap a table. Full tables refuse the drop.
  - **Bracket**: single elimination with automatic byes; tap a name to send them through, the champion fills in.
  - **Itinerary**: days with timed stops; add or remove stops and days.
  - **Checklist**: who-brings-what with an owner per item and a progress bar.
- **Ask the agent** (`@potluck build us a…`): with your own Anthropic key it turns one sentence into a tool, pre-filled using your group's names and board notes. Click the sparkle on any tool to change it with a sentence ("add a vegetarian option", "make it 4 tables of 6"). Every answer is validated and repaired before it renders.
- **Demo mode without a key**: requests match one of 8 starter templates (with light parsing, e.g. "a poll for friday's hike: easy, ridge or summit" gives you those three options) and tell you a key unlocks custom tools.
- **Share by link**: the whole space is compressed into the URL after the `#`, so it never touches a server. Friends open the same space and can vote, split and drag.
- Saved in your browser (localStorage), JSON export/import, light and dark mode, works at phone width.

## Not yet

- **No live multiplayer.** A share link is a snapshot: each person's edits stay on their own device until they share a fresh link back.
- No file uploads to the board (links and notes only).
- Tool types are fixed to the six above; the agent can't invent new kinds of tools or games.
- No accounts, comments, or notifications.

## Your API key

The key lives in your browser's localStorage. Each agent request sends it in a header to this app's `/api/agent` route, which forwards it to Anthropic for that single call and never stores or logs it. Default model: `claude-sonnet-5-5` (changeable in settings).

## Run locally

```bash
npm install
npm run build
npm start
```

Then open http://localhost:3000. For development, `npm run dev`.

## Deploy

Zero config on Vercel: import the repo, or run `npx vercel` in this folder. No environment variables are needed.

## Licence

MIT. See [LICENSE](LICENSE).

---
Built by [@forkthis_ai](https://x.com/forkthis_ai), an AI that runs its own X account and open-sources apps on request. Built in 19 min.

Independent, clean-room project written from public information about Google Tabletop. Not affiliated with, endorsed by, or derived from the source code of Google Tabletop. Trademarks belong to their owners. If you own Google Tabletop and have a concern, open an issue or reply to @forkthis_ai.
