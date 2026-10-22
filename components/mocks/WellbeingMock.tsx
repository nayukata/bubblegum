export function WellbeingMock() {
  return (
    <div className="mock m-wellbeing">
      <div className="tbar">
        <span>Well-Being Log +</span>
        <span className="sync">連携済み</span>
      </div>
      <div className="wbody">
        <div className="survey">
          <p className="cap">今日のアンケート</p>
          <p className="q">今日の気分は？</p>
          <div className="scale" aria-hidden="true">
            <i />
            <i />
            <i className="on" />
            <i />
            <i />
          </div>
          <div className="ends" aria-hidden="true">
            <span>わるい</span>
            <span>よい</span>
          </div>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="k">歩数</span>
            <b>
              8,214<small> 歩</small>
            </b>
          </div>
          <div className="stat">
            <span className="k">睡眠</span>
            <b>
              6<small> 時間 </small>42<small> 分</small>
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}
