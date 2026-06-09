"use client";

import { ErrorVisual } from "@/components/not-found-visual";

export default function ErrorPage() {
  return (
    <ErrorVisual
      code="500"
      message={
        <>
          Something went wrong while loading this page.
          <br />
          页面暂时出现异常，请返回后重试。
        </>
      }
      primaryLabel="Go home"
    />
  );
}
