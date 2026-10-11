# Launchpad

A launcher page for every GitHub Pages site on this account. A nightly GitHub Action lists your repos, keeps the ones with Pages turned on, and writes `projects.json`. The page reads that file, so nothing here needs hand-editing when you add a project.

## Setup (about 10 minutes)

1. **Create the repo.** Name it exactly `<your-username>.github.io`. If you already have one with content, put these files in a `launcher/` folder instead and the page will live at `/launcher/`.
2. **Add these files** to the repo root: `index.html`, `launcher.config.json`, `scripts/build-projects.mjs`, `.github/workflows/build-launcher.yml`.
3. **Turn on Pages.** Repo Settings → Pages → Deploy from a branch → `main` / root.
4. **Allow the Action to commit.** Settings → Actions → General → Workflow permissions → Read and write.
5. **Run it once.** Actions tab → Build launcher → Run workflow. After that it refreshes nightly, and you can hit the button any time you want a new project to show up right away.

## Organizing

- **Group with topics.** Add the topic `tool` or `game` to a repo (the gear icon next to "About" on the repo page). Change the groups or their order in `launcher.config.json` under `categories`.
- **Descriptions** come from each repo's About description.
- **Hide a repo** by adding the topic `launcher-hide`, or list its name under `exclude`.
- **Custom names or icons:** `"titles": { "word-ladder": "Word Ladder Daily" }`, `"icons": { "trivia": "🎲" }`. Otherwise each project gets a generated icon from its name.
- **Custom domains** are picked up from the Pages settings when readable; otherwise set the repo's About → Website field and the launcher uses that.

## Private repos

By default only public repos are listed. To include private repos that publish Pages, create a fine-grained token with read access to Metadata and Pages on your repos, and save it as an Actions secret named `LAUNCHER_TOKEN`. Note that the launcher page itself is public, so anything it lists is visible to anyone with the URL.

## Using it

Type `/` to search, Enter opens the top match, Esc clears. The page remembers your last few launches in a Recent row (stored in your browser only). On a phone, use Share → Add to Home Screen.
