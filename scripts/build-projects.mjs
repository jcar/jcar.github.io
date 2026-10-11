// Builds projects.json from every repo on this account that has GitHub Pages turned on.
// Runs in GitHub Actions (see .github/workflows/build-launcher.yml). Node 20+, no dependencies.
import { readFile, writeFile } from "node:fs/promises";

const owner = process.env.OWNER;
const token = process.env.LAUNCHER_TOKEN || process.env.GITHUB_TOKEN || "";
const usePat = Boolean(process.env.LAUNCHER_TOKEN);
const useApp = usePat && process.env.LAUNCHER_TOKEN_KIND === "app";
if (!owner) throw new Error("OWNER is not set.");

const config = JSON.parse(await readFile(new URL("../launcher.config.json", import.meta.url), "utf8"));
const exclude = new Set((config.exclude || []).map((n) => n.toLowerCase()));
exclude.add(`${owner}.github.io`.toLowerCase()); // the launcher itself

const headers = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}: ${await res.text()}`);
  return res.json();
}

// A GitHub App token or personal token can see private repos too; otherwise public only.
// App installation tokens can't call /user/repos, so they list the repos the App is installed on.
const listPath = useApp
  ? "/installation/repositories?per_page=100"
  : usePat
  ? "/user/repos?affiliation=owner&visibility=all&per_page=100"
  : `/users/${owner}/repos?type=owner&per_page=100`;

const repos = [];
for (let page = 1; ; page++) {
  const res = await gh(`${listPath}&page=${page}`);
  const batch = useApp ? res?.repositories : res;
  if (!batch || batch.length === 0) break;
  repos.push(...batch);
  if (batch.length < 100) break;
}

const keep = repos.filter((r) =>
  r.has_pages &&
  !exclude.has(r.name.toLowerCase()) &&
  !(r.topics || []).includes("launcher-hide") &&
  (config.includeForks || !r.fork) &&
  (config.includeArchived || !r.archived)
);

const titleCase = (name) =>
  name.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

const projects = [];
for (const r of keep) {
  // The Pages API knows about custom domains; fall back to the repo's website field, then the default URL.
  let url = null;
  try {
    const pages = await gh(`/repos/${r.owner.login}/${r.name}/pages`);
    url = pages?.html_url || null;
  } catch { /* not readable with this token; fall through */ }
  url ||= r.homepage?.trim() || `https://${owner.toLowerCase()}.github.io/${r.name}/`;

  projects.push({
    name: r.name,
    title: config.titles?.[r.name] || titleCase(r.name),
    description: r.description || "",
    url,
    repoUrl: r.html_url,
    topics: r.topics || [],
    icon: config.icons?.[r.name] || null,
    language: r.language,
    private: r.private,
    pushedAt: r.pushed_at,
  });
}

projects.sort((a, b) => a.title.localeCompare(b.title));

await writeFile(
  new URL("../projects.json", import.meta.url),
  JSON.stringify({ owner, generatedAt: new Date().toISOString(), projects }, null, 2) + "\n"
);
console.log(`Found ${projects.length} Pages sites out of ${repos.length} repos.`);
