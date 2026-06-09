"use client";

import { ErrorVisual } from "@/components/not-found-visual";
import "./globals.css";

export default function GlobalError() {
  return (
    <html lang="zh-CN">
      <body>
        <ErrorVisual
          code="500"
          message={
            <>
              The application could not finish this request.
              <br />
              应用暂时不可用，请稍后再试。
            </>
          }
          primaryLabel="Go home"
        />
      </body>
    </html>
  );
}
