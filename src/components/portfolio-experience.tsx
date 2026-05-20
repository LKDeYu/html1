"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { BookOpen, Code2, Mail, MessageCircle, Tags } from "lucide-react";
import { blogPreview, navItems } from "@/lib/content";
import type { ProjectRecord, SkillRecord } from "@/lib/portfolio-types";
import { DeferredStoryVisual } from "@/components/deferred-story-visual";
import { InfiniteCityCanvas } from "@/components/infinite-city-canvas";
import { STORY_SCROLL_DISTANCE, STORY_TOTAL_UNITS, getStorySceneStart } from "@/components/story-scene-timing";

const IntroWorkstation = dynamic(
  () => import("@/components/intro-workstation").then((mod) => mod.IntroWorkstation),
  { ssr: false },
);
const SkillCubeGallery = dynamic(
  () => import("@/components/skill-cube-gallery").then((mod) => mod.SkillCubeGallery),
  { ssr: false },
);
const ProjectHyperScroll = dynamic(
  () => import("@/components/project-hyper-scroll").then((mod) => mod.ProjectHyperScroll),
  { ssr: false },
);
const CampusGallery = dynamic(() => import("@/components/campus-gallery").then((mod) => mod.CampusGallery), {
  ssr: false,
});
const InterestCarousel = dynamic(
  () => import("@/components/interest-carousel").then((mod) => mod.InterestCarousel),
  { ssr: false },
);

const STORY_SCENE_FADE = 0.56;
const STORY_SCENE_ORDER = ["#about", "#skills", "#projects", "#campus", "#interests", "#blog", "#contact"];

type PortfolioExperienceProps = {
  projects: ProjectRecord[];
  skills: SkillRecord[];
  posts: PortfolioPostPreview[];
};

type PortfolioPostPreview = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
};

export function PortfolioExperience({ projects, skills, posts }: PortfolioExperienceProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const blogItems =
    posts.length > 0
      ? posts.slice(0, 4).map((post) => ({
          title: post.title,
          category: post.tags[0] || "学习笔记",
          description: post.summary,
        }))
      : blogPreview;

  const clearMenuCloseTimer = () => {
    if (menuCloseTimerRef.current) {
      clearTimeout(menuCloseTimerRef.current);
      menuCloseTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearMenuCloseTimer();
    setMenuOpen(true);
  };

  const scheduleMenuClose = () => {
    clearMenuCloseTimer();
    menuCloseTimerRef.current = setTimeout(() => {
      setMenuOpen(false);
      menuCloseTimerRef.current = null;
    }, 220);
  };

  const handleNavigate = (href: string) => {
    clearMenuCloseTimer();
    setMenuOpen(false);

    requestAnimationFrame(() => {
      let top = 0;

      if (href === "#home") {
        top = 0;
      } else if (window.matchMedia("(max-width: 860px)").matches) {
        top = document.querySelector<HTMLElement>(href)?.offsetTop ?? 0;
      } else {
        const index = STORY_SCENE_ORDER.indexOf(href);
        const storyTrigger = ScrollTrigger.getById("story-scroll");

        if (index >= 0 && storyTrigger) {
          const sceneStart = index === 0 ? 0 : getStorySceneStart(index) + 0.42;
          const progress = Math.min(sceneStart / STORY_TOTAL_UNITS, 0.98);
          top = storyTrigger.start + (storyTrigger.end - storyTrigger.start) * progress + 4;
        } else {
          top = document.querySelector<HTMLElement>(href)?.offsetTop ?? 0;
        }
      }

      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  useEffect(() => {
    document.documentElement.classList.add("dark", "cosmic");

    return () => {
      document.documentElement.classList.remove("cosmic");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) {
        clearTimeout(menuCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      duration: reduceMotion ? 0.1 : 1.16,
      smoothWheel: !reduceMotion,
      wheelMultiplier: 0.74,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      document.documentElement.style.setProperty("--story-scroll-distance", `${STORY_SCROLL_DISTANCE}px`);

      gsap.set(".hero-wordmark", {
        autoAlpha: 0,
        y: 34,
        filter: "blur(18px)",
      });

      gsap.to(".hero-wordmark", {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.45,
        delay: 0.62,
        ease: "power3.out",
      });

      const scenes = gsap.utils.toArray<HTMLElement>(".story-scene");
      gsap.set(scenes, {
        autoAlpha: 0,
        y: 70,
        scale: 0.97,
        filter: "blur(8px)",
      });
      gsap.set(scenes[0], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
      });

      const canUsePinnedTimeline = window.matchMedia("(min-width: 861px)").matches;

      if (!canUsePinnedTimeline) {
        gsap.set(scenes, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "story-scroll",
          trigger: ".story-shell",
          start: "top top",
          end: `+=${STORY_SCROLL_DISTANCE}`,
          scrub: 1,
          pin: ".story-stage",
          anticipatePin: 1,
        },
      });

      timeline.to(
        ".timeline-fill",
        {
          height: "100%",
          ease: "none",
          duration: STORY_TOTAL_UNITS,
        },
        0,
      );

      scenes.forEach((scene, index) => {
        const at = getStorySceneStart(index);
        timeline.to(
          `.timeline-dot-${index}`,
          {
            scale: 1.85,
            backgroundColor: "var(--accent-strong)",
            duration: 0.22,
          },
          at,
        );

        if (index === 0) {
          return;
        }

        timeline.to(
          scenes[index - 1],
          {
            autoAlpha: 0,
            y: -58,
            scale: 0.985,
            filter: "blur(7px)",
            duration: STORY_SCENE_FADE,
          },
          at,
        );
        timeline.to(
          scene,
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: STORY_SCENE_FADE,
          },
          at + 0.14,
        );
      });
    }, rootRef);

    return () => {
      document.documentElement.style.removeProperty("--story-scroll-distance");
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={rootRef} className={`site-shell ${menuOpen ? "menu-open" : ""}`}>
      <div
        className="menu-edge-zone"
        aria-hidden="true"
        onPointerEnter={openMenu}
        onPointerLeave={scheduleMenuClose}
        onClick={openMenu}
      />
      <SpatialMenu
        open={menuOpen}
        onNavigate={handleNavigate}
        onPointerEnter={openMenu}
        onPointerLeave={scheduleMenuClose}
      />

      <main className="site-main">
        <section id="home" className="hero-section">
          <InfiniteCityCanvas className="hero-city-canvas" />
          <div className="hero-noise" aria-hidden="true" />

          <div className="hero-wordmark">
            <p className="hero-eyebrow">Cloud Garden</p>
            <h1>
              <span>NAMRANTA</span>
              <small>ZHIHONG WU</small>
            </h1>
            <p className="hero-subtitle">AI portfolio, learning notes, projects, and campus life.</p>
          </div>
        </section>

        <section className="story-shell" aria-label="滚动时间轴作品集">
          <div className="story-stage">
            <aside className="timeline-rail" aria-hidden="true">
              <div className="timeline-track">
                <span className="timeline-fill" />
              </div>
              {["Intro", "Skills", "Projects", "Campus", "Interests", "Blog", "Contact"].map((label, index) => (
                <div className="timeline-node" key={label}>
                  <span className={`timeline-dot timeline-dot-${index}`} />
                  <em>{label}</em>
                </div>
              ))}
            </aside>

            <div className="story-scenes">
              <section id="about" className="story-scene scene-intro">
                <div className="scene-copy">
                  <div className="intro-profile-mark">
                    <Image src="/avatar.png" width={58} height={58} alt="吴志宏头像" priority />
                    <span>Zhihong Wu</span>
                  </div>
                  <p className="section-kicker">About / 关于我</p>
                  <h2>一个记录 AI 学习、项目实践和校园生活的个人网站。</h2>
                  <p>
                    我是吴志宏，江南大学人工智能专业 24 级学生。现在主要学习 C/C++、Python、机器学习、深度学习和云端部署，
                    也会把课程练习、项目复盘、校园照片和日常兴趣整理在这里。
                  </p>
                </div>
                <DeferredStoryVisual sceneIndex={0} fallbackClassName="intro-workstation-placeholder">
                  <IntroWorkstation />
                </DeferredStoryVisual>
              </section>

              <section id="skills" className="story-scene scene-skills immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Skills / 技能</p>
                  <h2>围绕编程基础、AI 实验和工程部署持续积累。</h2>
                  <p>我会把每项技能和具体课程、项目、笔记联系起来，而不是只列出工具名称。</p>
                </div>
                <DeferredStoryVisual sceneIndex={1} fallbackClassName="story-visual-placeholder warm">
                  <SkillCubeGallery skills={skills} />
                </DeferredStoryVisual>
              </section>

              <section id="projects" className="story-scene scene-projects immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Projects / 项目</p>
                  <h2>把做过的练习和项目整理成长期档案。</h2>
                  <p>每个项目会保留目标、技术栈、实现过程和复盘，方便之后继续补充截图、链接和实验结果。</p>
                </div>
                <DeferredStoryVisual sceneIndex={2}>
                  <ProjectHyperScroll projects={projects} />
                </DeferredStoryVisual>
              </section>

              <section id="campus" className="story-scene scene-campus immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Campus Life / 校园生活</p>
                  <h2>江南大学里的学习、风景和日常片段。</h2>
                  <p>这里记录教室、自习、校园景色、美食和课余生活，让个人网站不只停留在技术简历。</p>
                </div>
                <DeferredStoryVisual sceneIndex={3}>
                  <CampusGallery />
                </DeferredStoryVisual>
              </section>

              <section id="interests" className="story-scene scene-interests immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Interests / 兴趣</p>
                  <h2>阅读、运动、音乐和棋类，让生活保持节奏。</h2>
                  <p>这些兴趣会作为学习之外的记录，帮助我保留更完整的个人面貌。</p>
                </div>
                <DeferredStoryVisual sceneIndex={4}>
                  <InterestCarousel />
                </DeferredStoryVisual>
              </section>

              <section id="blog" className="story-scene scene-blog">
                <div className="scene-copy">
                  <p className="section-kicker">Blog / 学习笔记</p>
                  <h2>把学习中的问题、代码和复盘沉淀成文章。</h2>
                  <p>文章记录算法、Python、PyTorch、项目实践和工程运行中的关键细节，方便我之后回看和继续迭代。</p>
                </div>
                <div className="blog-console">
                  <div className="console-toolbar">
                    <Link href="/tags">
                      <Tags size={15} />
                      Tags
                    </Link>
                    <Link href="/blog">All posts</Link>
                  </div>
                  <ul className="papercut-list">
                    {blogItems.map((post, index) => (
                      <li key={post.title} style={{ "--i": index } as CSSProperties}>
                        <BookOpen size={20} />
                        <small>{post.category}</small>
                        <h3>
                          {posts[index]?.slug ? <Link href={`/blog/${posts[index].slug}`}>{post.title}</Link> : post.title}
                        </h3>
                        <p>{post.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section id="contact" className="story-scene scene-contact">
                <div className="contact-card">
                  <p className="section-kicker">Contact / 联系</p>
                  <h2>欢迎交流学习、项目和技术问题。</h2>
                  <p>目前公开 Gmail、GitHub 和 QQ，手机号不放在公开网页里。</p>
                  <div className="contact-links">
                    <a href="mailto:yuany257093418@gmail.com">
                      <Mail size={18} />
                      yuany257093418@gmail.com
                    </a>
                    <a href="https://github.com/LKDeYu" target="_blank" rel="noreferrer">
                      <Code2 size={18} />
                      github.com/LKDeYu
                    </a>
                    <a href="tencent://message/?uin=3292183027">
                      <MessageCircle size={18} />
                      QQ 3292183027
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SpatialMenu({
  open,
  onNavigate,
  onPointerEnter,
  onPointerLeave,
}: {
  open: boolean;
  onNavigate: (href: string) => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}) {
  return (
    <aside
      id="spatial-menu"
      className="spatial-menu"
      inert={!open ? true : undefined}
      aria-label="空间导航菜单"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div className="spatial-menu-inner">
        <p>Scroll Index</p>
        <h2>Section Rail</h2>
        <nav className="fly-rail" aria-label="滚动章节提示">
          {navItems.map((item, index) => (
            <button
              key={item.href}
              type="button"
              style={{ "--i": index } as CSSProperties}
              tabIndex={open ? 0 : -1}
              onClick={() => onNavigate(item.href)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
