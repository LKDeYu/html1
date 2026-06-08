"use client";

import { useEffect, useRef } from "react";
import { init, type WalineInstance } from "@waline/client";

type WalineCommentsProps = {
  path: string;
};

const DEFAULT_WALINE_SERVER_URL = "/waline";

export function WalineComments({ path }: WalineCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<WalineInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const serverURL = resolveWalineServerURL(process.env.NEXT_PUBLIC_WALINE_SERVER_URL || DEFAULT_WALINE_SERVER_URL);

    instanceRef.current = init({
      el: containerRef.current,
      serverURL,
      path,
      lang: "zh-CN",
      login: "force",
      commentSorting: "latest",
      pageSize: 10,
      noRss: true,
      emoji: false,
      imageUploader: false,
      highlighter: false,
      texRenderer: false,
      locale: {
        sofa: "还没有评论，登录后留下第一条想法吧。",
        placeholder: "登录后可以评论，适合留下建议、问题或读后感。",
        login: "登录后评论",
        comment: "评论",
        submit: "发布",
      },
    });

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [path]);

  return (
    <section className="homing-comments" aria-labelledby="article-comments-title">
      <div className="homing-comments-header">
        <p>Comments / 评论</p>
        <h2 id="article-comments-title">登录后参与讨论</h2>
      </div>
      <div ref={containerRef} />
    </section>
  );
}

function resolveWalineServerURL(serverURL: string) {
  if (/^(https?:)?\/\//u.test(serverURL)) {
    return serverURL.replace(/\/$/u, "");
  }

  return new URL(serverURL, window.location.origin).toString().replace(/\/$/u, "");
}
