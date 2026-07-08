export function TermMock() {
  return (
    <div className="mock m-term">
      <div className="tbar">
        <span className="dots">
          <span />
          <span />
          <span />
        </span>
        <span>claude — plugins</span>
      </div>
      <div className="tbody">
        <div>
          <span className="p">&gt;</span> <span className="cmd">/plugin install create-pr@nayukata</span>
        </div>
        <div>
          <span className="ok">✓</span> <span className="note">installed — PR 説明文はおまかせ</span>
        </div>
        <div>
          <span className="p">&gt;</span> <span className="cmd">/plugin install ux-laws@nayukata</span>
        </div>
        <div>
          <span className="ok">✓</span> <span className="note">installed — 全 6 スキル配布中</span>
        </div>
        <div>
          <span className="p">&gt;</span>
          <span className="cur" />
        </div>
      </div>
    </div>
  );
}
