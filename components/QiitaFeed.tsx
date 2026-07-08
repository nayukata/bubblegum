import type { QiitaItem } from "@/lib/feeds";

const QIITA_USER = "natume_nat";

export function QiitaFeed({ items }: { items: QiitaItem[] | null }) {
  if (!items) {
    return (
      <p className="feed-error">
        記事の自動取得に失敗しました。
        <a href={`https://qiita.com/${QIITA_USER}`} target="_blank" rel="noopener">
          Qiita で直接見る →
        </a>
      </p>
    );
  }

  return (
    <div className="a-grid">
      {items.map((item) => (
        <a className="acard glass float" href={item.url} target="_blank" rel="noopener" key={item.url}>
          <div className="a-meta">
            <span>{item.createdAt.slice(0, 10)}</span>
            <span className="lgtm">♥ {item.likesCount}</span>
          </div>
          <h3>{item.title}</h3>
          <div className="a-tags">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
