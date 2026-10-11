# Launchpad

The front door to everything I publish on GitHub Pages: **https://jcar.github.io**

This is the ops guide: how the site works, how I organize projects, and what to do when something needs changing or breaks.

## How it fits together

I keep each project in its own repo with GitHub Pages turned on, so each one lives at `https://jcar.github.io/<repo-name>/`. This repo is the launcher page that lists all of them.

```
my project repos (Pages on)
        │  nightly Action reads the GitHub API
        ▼
scripts/build-projects.mjs ──► projects.json ──► index.html (the page)
                                     ▲
                    launcher.config.json (names, icons, groups, exclusions)
```

- **Nothing here is edited by hand to add a project.** The Action finds every repo of mine that has Pages turned on and writes `projects.json`. The page reads that file.
- **Two repos, two jobs.** `jcar/jcar.github.io` (this one) is the website. `jcar/jcar` is the README shown on my GitHub profile page. They're unrelated, so editing one never affects the other.

## Files

| File | What it does | Edit it? |
|---|---|---|
| `index.html` | The page itself | Rarely |
| `launcher.config.json` | Display names, icons, groups, exclusions | Yes, this is the control panel |
| `projects.json` | Generated list of projects | No, the Action overwrites it |
| `scripts/build-projects.mjs` | Builds `projects.json` from the GitHub API | Rarely |
| `.github/workflows/build-launcher.yml` | Runs the script nightly and on demand | Rarely |

## Adding a new project

1. In the project's repo, turn on Pages: **Settings → Pages → Deploy from a branch** → pick the branch and folder.
2. On the repo's main page, click the gear next to **About** and fill in:
   - **Description**, which becomes the text on the launcher card.
   - **Topics**: add `tool` or `game` so it lands in the right group.
   - **Website**, only if it uses a custom domain (see below).
3. Wait for the nightly refresh, or update the list now (see [Refreshing the list](#refreshing-the-list)).

From the terminal, steps 2 and 3 are:

```sh
gh repo edit jcar/<repo> --description "One line about it" --add-topic game
gh workflow run build-launcher.yml -R jcar/jcar.github.io
```

## How I organize things

**Topics decide the grouping.** Each repo's topics come from its About settings.

| Topic | Effect |
|---|---|
| `tool` | Shows under **Tools** |
| `game` | Shows under **Games** |
| `launcher-hide` | Left off the launcher entirely (the repo and its site still exist) |
| *(no group topic)* | Shows under **Everything else** |

- Groups appear in the order listed under `categories` in `launcher.config.json`. A project with both `tool` and `game` goes in whichever group comes first.
- Every topic in use also gets a filter chip at the top of the page, so other topics (like `chess` or `kids`) are useful for filtering even without a group of their own.
- To add a group, add an entry to `categories`, e.g. `{ "topic": "data", "label": "Data & Viz" }`, then tag repos with `data`.

**Every repo should have a description and a group topic.** If a card looks blank or lands in "Everything else," that's what's missing.

**Use `launcher-hide` for anything that shouldn't be one click from my front page:** experiments, demos, and anything built on someone else's data. Hiding only removes the link from here. A public repo with Pages on is still public, so to take a site down, turn off Pages in that repo.

### `launcher.config.json` reference

```json
{
  "title": "Launchpad",
  "categories": [
    { "topic": "tool", "label": "Tools" },
    { "topic": "game", "label": "Games" }
  ],
  "otherLabel": "Everything else",
  "exclude": [],
  "includeForks": false,
  "includeArchived": false,
  "titles": {},
  "icons": {}
}
```

| Key | What it does | Takes effect |
|---|---|---|
| `title` | Page heading and browser tab name | As soon as Pages redeploys (about 1 min) |
| `categories` | Groups and their order | As soon as Pages redeploys |
| `otherLabel` | Name of the catch-all group | As soon as Pages redeploys |
| `titles` | Display names, e.g. `"muthur-terminal": "MU-TH-UR 6000"`. Otherwise the repo name is title-cased. | After the list rebuilds |
| `icons` | Emoji per repo, e.g. `"chess-openings": "♟️"`. Otherwise it gets a generated monogram tile. | After the list rebuilds |
| `exclude` | Repo names to leave off (same as `launcher-hide`, but kept here) | After the list rebuilds |
| `includeForks` / `includeArchived` | Show forked or archived repos | After the list rebuilds |

Pushing a change to `launcher.config.json` rebuilds the list automatically, so in practice every change shows up within a couple of minutes.

**Custom domains.** The script picks up custom domains from each repo's Pages settings (that's how `chess-trainer` links to chesshall.app). If one doesn't come through, set the repo's **About → Website** field and the launcher will use that.

## Refreshing the list

The list rebuilds:

- **Nightly** at 06:17 UTC.
- **When I push** a change to `launcher.config.json` or `scripts/`.
- **On demand:** Actions tab → **Build launcher** → **Run workflow**, or `gh workflow run build-launcher.yml -R jcar/jcar.github.io`.

Each rebuild commits a fresh `projects.json`, and GitHub Pages redeploys the site about a minute later. To watch it happen:

```sh
gh run list -R jcar/jcar.github.io --limit 4
```

You should see **Build launcher** and then **pages-build-deployment**, both green.

To preview a rebuild locally without waiting for the Action (needs Node 20+ and `gh` logged in):

```sh
OWNER=jcar GITHUB_TOKEN=$(gh auth token) node scripts/build-projects.mjs
```

## Settings this depends on

These are set once and should stay as they are:

- **Pages** (Settings → Pages): deploy from branch `main`, folder `/ (root)`.
- **Workflow permissions** (Settings → Actions → General): **Read and write**, so the Action can commit `projects.json`.

## Troubleshooting

**A project isn't showing up.** Check, in order:
1. Pages is turned on in that repo (`has_pages` is what the script looks for).
2. The repo is public. Private repos need the token below.
3. It isn't tagged `launcher-hide`, listed in `exclude`, a fork, or archived.
4. The list has rebuilt since the change. Run the workflow manually.

**Build launcher failed with `! [rejected] main -> main (fetch first)`.** Two runs overlapped: usually a push started one and I started another by hand. Harmless. The list from the other run is already live. Run the workflow once more to confirm it's green.

**Build launcher failed on the push step with a permissions error.** Workflow permissions got reset to read-only. Set them back to read and write (see above), or run:
```sh
gh api -X PUT repos/jcar/jcar.github.io/actions/permissions/workflow -f default_workflow_permissions=write
```

**The nightly run stopped happening.** GitHub disables scheduled workflows in repos with no activity for 60 days. Actions tab → Build launcher → **Enable workflow**.

**The page loads but looks stale.** Check the "List refreshed" line under the search box. If it's old, run the workflow. If it's recent, hard-refresh the browser.

## Private repos

My project repos are private, but their Pages sites are public. That takes **GitHub Pro**: on the free plan, making a repo private takes its site down.

The default Actions token only sees public repos, so the launcher reads them with a fine-grained token saved as the Actions secret `LAUNCHER_TOKEN`:

- **Resource owner:** jcar. **Repository access:** All repositories.
- **Permissions:** Pages: Read-only (Metadata: Read-only is added automatically).
- Save it with `gh secret set LAUNCHER_TOKEN -R jcar/jcar.github.io` and paste the token when prompted.

**When the token expires,** Build launcher fails with a 401. The site stays up with the last list, but new projects won't appear. Make a new token and save it over the old secret.

Cards for private repos leave out the GitHub link, since visitors would get a 404. The launcher page is public, so anything it lists (names, descriptions) is visible to anyone with the URL.

To make a project private: `gh repo edit jcar/<repo> --visibility private --accept-visibility-change-consequences`. Stars and watchers are erased. Its Pages builds then count against the account's Actions minutes.

## Using the page

Type `/` to search, Enter opens the top match, Esc clears. Click a topic chip to filter. The page remembers your last few launches in a Recent row, stored in your browser only. On a phone, use Share → Add to Home Screen.
