import Link from "next/link";
import type { ReactNode } from "react";

const pieces = ["one", "two", "three"] as const;

type ErrorVisualProps = {
  code: string;
  message: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ErrorVisual({
  code,
  message,
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref = "/blog/home",
  secondaryLabel = "Read blog",
}: ErrorVisualProps) {
  return (
    <main className="not-found-page">
      <nav className="not-found-menu" aria-label={`${code} navigation`}>
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
            <p className="not-found-404 front">{code}</p>
            <p className="not-found-404 back">{code}</p>
          </div>

          <article className="not-found-text">
            <p>{message}</p>
            <div>
              <Link href={primaryHref}>{primaryLabel}</Link>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export function NotFoundVisual() {
  return (
    <ErrorVisual
      code="404"
      message={
        <>
          Uh oh! Looks like this page drifted away.
          <br />
          Go back to the homepage if you dare.
        </>
      }
      primaryLabel="I dare!"
    />
  );
}
