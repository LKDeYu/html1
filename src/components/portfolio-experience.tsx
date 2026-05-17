"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  BookOpen,
  Cloud,
  Code2,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { blogPreview, navItems, projects } from "@/lib/content";
import { CampusGallery } from "@/components/campus-gallery";
import { InfiniteCityCanvas } from "@/components/infinite-city-canvas";
import { IntroWorkstation } from "@/components/intro-workstation";
import { InterestCarousel } from "@/components/interest-carousel";
import { ProjectHyperScroll } from "@/components/project-hyper-scroll";
import { SkillCubeGallery } from "@/components/skill-cube-gallery";

const STORY_SCROLL_DISTANCE = 9600;
const STORY_SCENE_STEP = 1.42;
const STORY_SCENE_FADE = 0.56;
const STORY_SCENE_ORDER = [
  "#about",
  "#skills",
  "#projects",
  "#campus",
  "#interests",
  "#blog",
  "#guestbook",
  "#contact",
];

export function PortfolioExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
          const timelineDuration = STORY_SCENE_ORDER.length * STORY_SCENE_STEP;
          const sceneStart = index === 0 ? 0 : index * STORY_SCENE_STEP + 0.82;
          const progress = Math.min(sceneStart / timelineDuration, 0.98);
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
      wheelMultiplier: 0.82,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
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
          duration: scenes.length * STORY_SCENE_STEP,
        },
        0,
      );

      scenes.forEach((scene, index) => {
        const at = index * STORY_SCENE_STEP;
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
            <p className="hero-subtitle">
              AI portfolio, learning notes, and a cloud-deployed personal website.
            </p>
          </div>
        </section>

        <section className="story-shell" aria-label="滚动触发的作品集动画">
          <div className="story-stage">
            <aside className="timeline-rail" aria-hidden="true">
              <div className="timeline-track">
                <span className="timeline-fill" />
              </div>
              {["Intro", "Skills", "Projects", "Campus", "Interests", "Blog", "System", "Contact"].map((label, index) => (
                <div className="timeline-node" key={label}>
                  <span className={`timeline-dot timeline-dot-${index}`} />
                  <em>{label}</em>
                </div>
              ))}
            </aside>

            <div className="story-scenes">
              <section id="about" className="story-scene scene-intro">
                <div className="scene-copy">
                  <p className="section-kicker">About / 关于我</p>
                  <h2>一个面向 AI 学习与云端实践的个人网站。</h2>
                  <p>
                    我是吴志宏，江南大学人工智能专业 24 级学生。当前关注 C/C++、Python、PyTorch、机器学习和深度学习，
                    同时通过这个网站完成从前端动效、后端内容管理到阿里云 ECS 部署的完整实践。
                  </p>
                </div>
                <IntroWorkstation />
              </section>

              <section id="skills" className="story-scene scene-skills immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Skill Galaxy / 技能星图</p>
                  <h2>立方体随时间轴翻转，展示学习中的技术栈。</h2>
                  <p>不使用熟练度百分比，而是用一组可旋转的 3D 面来呈现编程、模型和云部署方向。</p>
                </div>
                <SkillCubeGallery />
              </section>

              <section id="projects" className="story-scene scene-projects immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Projects / 学习项目</p>
                  <h2>项目经历改成高速穿梭的赛博空间。</h2>
                  <p>卡片在深度空间中循环，配合滚动速度、HUD 和大字标题展示学习项目。</p>
                </div>
                <ProjectHyperScroll projects={projects} />
              </section>

              <section id="campus" className="story-scene scene-campus immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Campus Life / 校园生活</p>
                  <h2>先用占位图片搭出滚动相册，后续替换成真实校园照片。</h2>
                  <p>这一页用于承载江南大学校园、学习空间、生活片段和活动记录。</p>
                </div>
                <CampusGallery />
              </section>

              <section id="interests" className="story-scene scene-interests immersive-scene">
                <div className="scene-copy">
                  <p className="section-kicker">Interests / 兴趣</p>
                  <h2>用旋转照片环先搭出兴趣页的视觉骨架。</h2>
                  <p>图片后续可以替换成真实素材；现在先用占位图验证 3D 环形相册和 Rymd 的融合效果。</p>
                </div>
                <InterestCarousel />
              </section>

              <section id="blog" className="story-scene scene-blog">
                <div className="scene-copy">
                  <p className="section-kicker">Blog CMS / 学习笔记</p>
                  <h2>博客要做成可长期维护的知识库。</h2>
                  <p>
                    后台支持 Markdown、分类、标签、搜索、草稿、置顶和浏览量。默认栏目先放机器学习、深度学习、云计算和项目复盘。
                  </p>
                </div>
                <div className="blog-console">
                  <div className="console-toolbar">
                    <span>
                      <Search size={15} />
                      Search notes
                    </span>
                    <span>
                      <Tags size={15} />
                      Categories
                    </span>
                    <span>Pinned</span>
                  </div>
                  <ul className="papercut-list">
                    {blogPreview.map((post, index) => (
                      <li key={post.title} style={{ "--i": index } as CSSProperties} tabIndex={0}>
                        <BookOpen size={20} />
                        <small>{post.category}</small>
                        <h3>{post.title}</h3>
                        <p>{post.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section id="guestbook" className="story-scene scene-system">
                <div className="scene-copy">
                  <p className="section-kicker">Cloud System / 后端与部署</p>
                  <h2>留言审核、后台登录和阿里云部署作为完整闭环。</h2>
                  <p>
                    留言默认进入待审核状态，后台账号为 LKDeYu。部署阶段会使用 Ubuntu ECS、Nginx、PM2、SQLite 和 HTTPS，
                    并整理进最终实验报告。
                  </p>
                </div>
                <div className="system-grid">
                  <SystemTile icon={<ShieldCheck size={22} />} title="Admin">
                    用户名 + 密码 + 验证码登录，管理博客和留言审核。
                  </SystemTile>
                  <SystemTile icon={<MessageCircle size={22} />} title="Guestbook">
                    留言字段包含姓名、邮箱、内容、头像、时间和 IP 信息。
                  </SystemTile>
                  <SystemTile icon={<Cloud size={22} />} title="Alibaba Cloud">
                    最终部署到 ECS，Nginx 只开放 80/443，Next 服务运行在内网端口。
                  </SystemTile>
                  <SystemTile icon={<Code2 size={22} />} title="SQLite">
                    数据库文件随项目部署，适合课程项目和轻量内容管理。
                  </SystemTile>
                </div>
              </section>

              <section id="contact" className="story-scene scene-contact">
                <div className="contact-card">
                  <p className="section-kicker">Contact / 联系</p>
                  <h2>保持简洁，只公开必要联系方式。</h2>
                  <p>手机号不放到公网页面。当前公开 Gmail、GitHub 和 QQ。</p>
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
      aria-hidden={!open}
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

function SystemTile({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="system-tile">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
