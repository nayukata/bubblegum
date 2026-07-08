export function HearcatMock() {
  return (
    <div className="mock m-hearcat">
      <div className="tbar">
        <span className="dots">
          <span />
          <span />
          <span />
        </span>
        <span>HearCat — ライブ</span>
        <span className="wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="rec">REC</span>
      </div>
      <div className="rows">
        <div className="row">
          <span className="ts">[10:02:14]</span>
          <span className="who them">相手</span>
          <p>前回の障害の再発防止策はどうなっていますか？</p>
        </div>
        <div className="row">
          <span className="ts">[10:02:31]</span>
          <span className="who me">自分</span>
          <p>リトライ処理を見直して、監視も追加しました。</p>
        </div>
        <div className="row">
          <span className="ts">[10:02:58]</span>
          <span className="who them">相手</span>
          <p>リリースは今週中にいけそうですか？</p>
        </div>
        <div className="row live">
          <span className="ts">認識中</span>
          <span className="who me">自分</span>
          <p>はい、金曜のデプロイ枠を確保しています</p>
        </div>
      </div>
    </div>
  );
}
