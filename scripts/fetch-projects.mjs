// Corre solo en CI (o localmente para pruebas): consulta la API de GitHub,
// filtra forks y exclusiones, y escribe data/projects.json para servirlo estatico.
import { writeFile, mkdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";

const GITHUB_USER = "akamariano";
const CONFIG_PATH = new URL("../projects.config.json", import.meta.url);
const OUTPUT_DIR = new URL("../data/", import.meta.url);
const OUTPUT_PATH = new URL("../data/projects.json", import.meta.url);

async function loadConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      exclude: new Set(parsed.exclude ?? []),
      pinned: parsed.pinned ?? [],
      descriptions: parsed.descriptions ?? {},
    };
  } catch {
    return { exclude: new Set(), pinned: [], descriptions: {} };
  }
}

function authHeaders() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchTech(repoName) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${repoName}/languages`,
      { headers: authHeaders() }
    );
    if (!res.ok) return [];
    const langs = await res.json();
    const total = Object.values(langs).reduce((sum, v) => sum + v, 0) || 1;
    return Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .filter(([, bytes]) => bytes / total >= 0.03)
      .slice(0, 5)
      .map(([name]) => name);
  } catch {
    return [];
  }
}

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers: authHeaders() }
  );

  if (!res.ok) {
    throw new Error(`GitHub API respondio ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function toCard(repo, descriptions) {
  return {
    name: repo.name,
    description: descriptions[repo.name] || repo.description,
    url: repo.html_url,
    homepage: repo.homepage || null,
    language: repo.language,
    tech: await fetchTech(repo.name),
    stars: repo.stargazers_count,
    topics: repo.topics ?? [],
    updatedAt: repo.updated_at,
  };
}

async function main() {
  const [config, repos] = await Promise.all([loadConfig(), fetchRepos()]);

  const visible = repos.filter((repo) => !repo.fork && !config.exclude.has(repo.name));

  visible.sort((a, b) => {
    const aPinned = config.pinned.indexOf(a.name);
    const bPinned = config.pinned.indexOf(b.name);
    if (aPinned !== -1 || bPinned !== -1) {
      if (aPinned === -1) return 1;
      if (bPinned === -1) return -1;
      return aPinned - bPinned;
    }
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    projects: await Promise.all(visible.map((repo) => toCard(repo, config.descriptions))),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));

  console.log(`Escritos ${payload.projects.length} proyectos en data/projects.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
