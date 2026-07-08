type ContactLink = {
  label: string;
  href: string;
  viewBox: string;
  path: string;
};

// path はいずれも各サービスの公式ブランドマーク(単色)を currentColor で塗る
const CONTACT_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/nayukata",
    viewBox: "0 0 24 24",
    path: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z",
  },
  {
    label: "X",
    href: "https://x.com/natume_nat",
    viewBox: "0 0 24 24",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z",
  },
  {
    // Discord はプロフィールリンクが未ログインだと開けないことがあるため、
    // フレンド申請用にユーザー名をそのままラベルに出す
    label: "natumenat",
    href: "https://discordapp.com/users/251298208263700502",
    viewBox: "0 0 127.14 96.36",
    path: "M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z",
  },
] as const satisfies readonly ContactLink[];

export function Contact() {
  return (
    <section className="contact" id="contact">
      <div
        className="blob"
        style={{ width: 260, height: 260, background: "rgba(217,210,245,0.4)", top: "20%", left: "10%" }}
        aria-hidden="true"
      />
      <div
        className="blob"
        style={{
          width: 180,
          height: 180,
          background: "rgba(207,235,221,0.4)",
          bottom: "15%",
          right: "12%",
          animationDelay: "-9s",
        }}
        aria-hidden="true"
      />
      <div className="section-inner">
        <p className="sec-eyebrow float">contact</p>
        <h2 className="float">困りごと、聞かせてください。</h2>
        <p className="float">
          技術の相談でも、ゲームの話でも、猫の写真でも。
          <br />
          だいたい下のどこかにいます。
        </p>
        <div className="c-links float">
          {CONTACT_LINKS.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener">
              <svg viewBox={link.viewBox} fill="currentColor" aria-hidden="true">
                <path d={link.path} />
              </svg>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
