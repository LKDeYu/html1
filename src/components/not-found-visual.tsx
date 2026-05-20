import Link from "next/link";

const pieces = ["one", "two", "three"] as const;

export function NotFoundVisual() {
  return (
    <main className="not-found-page">
      <nav className="not-found-menu" aria-label="404 navigation">
        <Link className="not-found-logo" href="/">
          Namranta
        </Link>
        <div className="not-found-links">
          <Link href="/#about">About</Link>
          <Link href="/#projects">Projects</Link>
          <Link href="/blog/home">Blog</Link>
        </div>
        <span className="not-found-menu-icon" aria-hidden="true" />
      </nav>

      <section className="not-found-wrapper">
        <div className="not-found-container">
          <div className="not-found-scene" aria-hidden="true">
            <div className="not-found-circle" />
            {pieces.map((piece) => (
              <div className={`not-found-orbit ${piece}`} key={piece}>
                <div className="not-found-piece-content">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
            <p className="not-found-404 front">404</p>
            <p className="not-found-404 back">404</p>
          </div>

          <article className="not-found-text">
            <p>
              Uh oh! Looks like this page drifted away.
              <br />
              Go back to the homepage if you dare.
            </p>
            <div>
              <Link href="/">I dare!</Link>
              <Link href="/blog/home">Read blog</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
