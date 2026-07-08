import { Opening } from "@/components/Opening";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { WorksShowcase } from "@/components/WorksShowcase";
import { QiitaFeed } from "@/components/QiitaFeed";
import { RepoFeed } from "@/components/RepoFeed";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { FloatReveal } from "@/components/FloatReveal";
import { HashScrollRestore } from "@/components/HashScrollRestore";
import { fetchQiitaItems, fetchRepos } from "@/lib/feeds";

export default async function HomePage() {
  const [qiitaItems, repos] = await Promise.all([fetchQiitaItems(), fetchRepos()]);

  return (
    <>
      <FloatReveal />
      <Opening />
      <Hero />
      <About />
      <WorksShowcase />
      {/* HashScrollRestore は WorksShowcase より後に置く。#worksWrap の高さは
          WorksShowcase 側の useLayoutEffect で確定するため、その後に同じ layout effect
          フェーズで同期的にスクロール復元しないと、View Transition が新画面を
          キャプチャする時点でまだ scrollY=0 のままになり、戻り遷移で対象パネルが
          ビューポート外になって共有要素の morph が発火しなくなる。 */}
      <HashScrollRestore />
      <section className="feeds" id="articles">
        <div
          className="blob"
          style={{ width: 320, height: 320, background: "rgba(191,227,240,0.4)", top: -70, left: -60 }}
          aria-hidden="true"
        />
        <div
          className="blob"
          style={{
            width: 200,
            height: 200,
            background: "rgba(245,216,228,0.4)",
            bottom: "5%",
            right: -40,
            animationDelay: "-5s",
          }}
          aria-hidden="true"
        />
        <div className="section-inner">
          <p className="sec-eyebrow float">articles</p>
          <h2 className="sec-title float">書いたもの</h2>
          <p className="sec-note float">
            この一覧は <b>自動更新</b> です。手で更新するのは面倒なので。
            <span className="sec-note-sub">Qiita API から LGTM 順に同期</span>
          </p>
          <QiitaFeed items={qiitaItems} />
          <p className="sec-eyebrow float">repositories</p>
          <h2 className="sec-title float">公開しているもの</h2>
          <p className="sec-note float">
            こちらも <b>自動更新</b>。
            <span className="sec-note-sub">GitHub API からスター順に同期</span>
          </p>
          <RepoFeed repos={repos} />
        </div>
      </section>
      <Contact />
      <Footer />
    </>
  );
}
