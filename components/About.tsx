const TRAITS = [
  {
    dotBg: "rgba(245,216,228,0.9)",
    dotBorder: "#D48FB0",
    title: "猫が好き",
    body: "ノルウェージャンとラグドールが特に好き。もふもふは正義。このサイトの右下にも一匹います。",
  },
  {
    dotBg: "rgba(191,227,240,0.9)",
    dotBorder: "#6FA8CF",
    title: "面倒くさがり = 自動化",
    body: "同じ作業を二度やったら仕組みにする主義。このサイトの記事一覧も、面倒なので自動で更新されています。",
  },
  {
    dotBg: "rgba(207,235,221,0.9)",
    dotBorder: "#5DBD9A",
    title: "力になりたい",
    body: "困っている人を見ると放っておけないタイプ。技術で解決できる困りごと、いつでも歓迎です。",
  },
  {
    dotBg: "rgba(217,210,245,0.9)",
    dotBorder: "#7F77DD",
    title: "ゲームと配信",
    body: "オンラインゲームが好きで、配信もよく見ています。ゲームの「気持ちいい演出」はものづくりの教科書。",
  },
  {
    dotBg: "rgba(250,228,214,0.9)",
    dotBorder: "#D9A46A",
    title: "アニメ",
    body: "季節ごとに新作を追いかけるくらいには好き。作画にも脚本にも、作り手のこだわりが滲む瞬間に弱いです。",
  },
  {
    dotBg: "rgba(232,213,232,0.9)",
    dotBorder: "#B978B4",
    title: "韓国ドラマ",
    body: "台詞の言い回しにいちいち惚れます。社会問題に真正面から切り込む作品も多くて、そこも好き。推しはソン・ガン。",
  },
] as const;

export function About() {
  return (
    <section className="about" id="about">
      <div
        className="blob"
        style={{ width: 300, height: 300, background: "rgba(207,235,221,0.4)", top: -60, right: -40 }}
        aria-hidden="true"
      />
      <div
        className="blob"
        style={{
          width: 180,
          height: 180,
          background: "rgba(217,210,245,0.45)",
          bottom: "10%",
          left: -30,
          animationDelay: "-8s",
        }}
        aria-hidden="true"
      />
      <div className="section-inner">
        <p className="sec-eyebrow float">about</p>
        <h2 className="sec-title float">つくるのは、ラクをするため。</h2>
        <p className="sec-note float">6つの成分でできています。</p>
        <div className="about-grid">
          {TRAITS.map((trait) => (
            <div className="trait glass float" key={trait.title}>
              <span className="t-dot" style={{ background: trait.dotBg, borderColor: trait.dotBorder }} />
              <h3>{trait.title}</h3>
              <p>{trait.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
