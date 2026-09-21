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
    };
  } catch {
    return { exclude: new Set(), pinned: [] };
  }
}

async function fetchRepos() {
  const headers = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers }
  );

  if (!res.ok) {
    throw new Error(`GitHub API respondio ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function toCard(repo) {
  return {
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    homepage: repo.homepage || null,
    language: repo.language,
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
    projects: visible.map(toCard),
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload, null, 2));

  console.log(`Escritos ${payload.projects.length} proyectos en data/projects.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
