// Qiita / GitHub からの自動取得。サーバー側でのみ実行し、失敗時は null を返して呼び出し側にフォールバック表示を委ねる。
import "server-only";

export type QiitaItem = {
  title: string;
  url: string;
  likesCount: number;
  createdAt: string;
  tags: readonly string[];
};

export type GithubRepo = {
  name: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQiitaApiItem(
  value: unknown
): value is { title: string; url: string; likes_count: number; created_at: string; tags: { name: string }[] } {
  if (!isRecord(value)) return false;
  return (
    typeof value.title === "string" &&
    typeof value.url === "string" &&
    typeof value.likes_count === "number" &&
    typeof value.created_at === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => isRecord(tag) && typeof tag.name === "string")
  );
}

function isGithubApiRepo(
  value: unknown
): value is {
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  pushed_at: string;
} {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    typeof value.html_url === "string" &&
    (value.description === null || typeof value.description === "string") &&
    typeof value.stargazers_count === "number" &&
    (value.language === null || typeof value.language === "string") &&
    typeof value.fork === "boolean" &&
    typeof value.pushed_at === "string"
  );
}

export async function fetchQiitaItems(): Promise<QiitaItem[] | null> {
  try {
    const res = await fetch("https://qiita.com/api/v2/users/natume_nat/items?per_page=30", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !data.every(isQiitaApiItem)) return null;
    return data
      .sort((a, b) => b.likes_count - a.likes_count)
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        url: item.url,
        likesCount: item.likes_count,
        createdAt: item.created_at,
        tags: item.tags.slice(0, 3).map((tag) => tag.name),
      }));
  } catch {
    return null;
  }
}

export async function fetchRepos(): Promise<GithubRepo[] | null> {
  try {
    const res = await fetch("https://api.github.com/users/nayukata/repos?per_page=100&sort=updated", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !data.every(isGithubApiRepo)) return null;
    return data
      .filter((repo) => !repo.fork)
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
      )
      .slice(0, 6)
      .map((repo) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
      }));
  } catch {
    return null;
  }
}
