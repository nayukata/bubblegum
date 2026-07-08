import type { GithubRepo } from "@/lib/feeds";

const GITHUB_USER = "nayukata";

export function RepoFeed({ repos }: { repos: GithubRepo[] | null }) {
  if (!repos) {
    return (
      <p className="feed-error">
        リポジトリの自動取得に失敗しました。
        <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener">
          GitHub で直接見る →
        </a>
      </p>
    );
  }

  return (
    <div className="r-row">
      {repos.map((repo) => (
        <a className="rcard glass float" href={repo.url} target="_blank" rel="noopener" key={repo.url}>
          <div className="r-top">
            <h3>{repo.name}</h3>
            <span className="star">★ {repo.stars}</span>
          </div>
          <p>{repo.description || "（説明はまだありません）"}</p>
          <span className="lang">{repo.language || "—"}</span>
        </a>
      ))}
    </div>
  );
}
