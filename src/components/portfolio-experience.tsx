"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  ArrowDown,
  BookOpen,
  Cloud,
  Code2,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Tags,
  X,
} from "lucide-react";
import { blogPreview, navItems, projects, skillGroups } from "@/lib/content";

export function PortfolioExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (href: string) => {
    setMenuOpen(false);

    requestAnimationFrame(() => {
      const sceneOrder = ["#about", "#skills", "#projects", "#blog", "#guestbook"];
      let top = 0;

      if (href === "#home") {
        top = 0;
      } else if (href === "#contact") {
        top = document.querySelector<HTMLElement>("#contact")?.offsetTop ?? 0;
      } else if (window.matchMedia("(max-width: 860px)").matches) {
        top = document.querySelector<HTMLElement>(href)?.offsetTop ?? 0;
      } else {
        const index = sceneOrder.indexOf(href);
        const shellTop = document.querySelector<HTMLElement>(".story-shell")?.offsetTop ?? 0;
        const storyDistance = 4300;
        const timelineDuration = sceneOrder.length * 1.1;
        const sceneStart = index >= 0 ? (index * 1.05) / timelineDuration : 0;
        top = shellTop + storyDistance * sceneStart + 6;
      }

      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem("namranta-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lenis = new Lenis({
      duration: reduceMotion ? 0.1 : 1.16,
      smoothWheel: !reduceMotion,
      wheelMultiplier: 0.92,
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

      gsap.to(".liquid-glass", {
        y: -18,
        rotate: 4,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.24,
      });

      gsap.to(".ambient-ring", {
        rotate: 360,
        duration: 24,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".hero-timefield span", {
        xPercent: 18,
        opacity: 0.82,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.16,
      });

      gsap.to(".hero-depth-cards span", {
        y: -16,
        rotateX: 8,
        rotateY: -10,
        duration: 5.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.28,
      });

      const scenes = gsap.utils.toArray<HTMLElement>(".story-scene");
      gsap.set(scenes, {
        autoAlpha: 0,
        y: 70,
        scale: 0.97,
        filter: "blur(10px)",
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
          filter: "none",
        });
        return;
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-shell",
          start: "top top",
          end: "+=4300",
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
          duration: scenes.length * 1.1,
        },
        0,
      );

      timeline.to(
        ".stage-orb",
        {
          xPercent: 18,
          yPercent: -12,
          scale: 1.08,
          ease: "sine.inOut",
          duration: scenes.length * 1.1,
        },
        0,
      );

      scenes.forEach((scene, index) => {
        const at = index * 1.05;
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
            filter: "blur(10px)",
            duration: 0.42,
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
            duration: 0.54,
          },
          at + 0.12,
        );
      });

      gsap.to(".orbit-track", {
        rotate: 360,
        ease: "none",
        scrollTrigger: {
          trigger: ".story-shell",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      gsap.to(".project-card", {
        xPercent: -12,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: {
          trigger: "#projects",
          start: "top 80%",
          end: "bottom 20%",
          scrub: true,
        },
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
      <Header
        isDark={isDark}
        menuOpen={menuOpen}
        onNavigate={handleNavigate}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onToggleTheme={() => setIsDark((value) => !value)}
      />
      <SpatialMenu open={menuOpen} onNavigate={handleNavigate} />

      <main className="site-main">
        <section id="home" className="hero-section">
          <div className="hero-noise" aria-hidden="true" />
          <div className="liquid-glass glass-one" aria-hidden="true" />
          <div className="liquid-glass glass-two" aria-hidden="true" />
          <div className="liquid-glass glass-three" aria-hidden="true" />
          <div className="ambient-ring" aria-hidden="true" />
          <div className="hero-timefield" aria-hidden="true">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} style={{ "--i": index } as CSSProperties} />
            ))}
          </div>
          <div className="hero-depth-cards" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="hero-wordmark">
            <div className="hero-mark" aria-hidden="true">
              <span />
              <span />
            </div>
            <p className="hero-eyebrow">Cloud Garden</p>
            <h1>
              <span>NAMRANTA</span>
              <small>ZHIHONG WU</small>
            </h1>
            <p className="hero-subtitle">
              AI portfolio, learning notes, and a cloud-deployed personal website.
            </p>
          </div>

          <a
            className="scroll-cue"
            href="#about"
            aria-label="向下滚动查看内容"
            onClick={(event) => {
              event.preventDefault();
              handleNavigate("#about");
            }}
          >
            <span>Scroll</span>
            <ArrowDown size={18} />
          </a>
        </section>

        <section className="story-shell" aria-label="滚动触发的作品集动画">
          <div className="story-stage">
            <div className="stage-backdrop" aria-hidden="true">
              <div className="stage-orb" />
              <div className="stage-grid" />
            </div>

            <aside className="timeline-rail" aria-hidden="true">
              <div className="timeline-track">
                <span className="timeline-fill" />
              </div>
              {["Intro", "Skills", "Projects", "Blog", "System"].map((label, index) => (
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
                    我是吴志宏，江南大学人工智能专业 24 级学生。当前关注 C/C++、
                    Python、PyTorch、机器学习和深度学习，同时通过这个网站完成从前端动效、
                    后端内容管理到阿里云 ECS 部署的完整实践。
                  </p>
                </div>
                <div className="profile-glass-card">
                  <Image
                    src="/avatar.png"
                    alt="吴志宏头像"
                    width={148}
                    height={148}
                    priority
                  />
                  <div>
                    <span>Jiangnan University</span>
                    <strong>Artificial Intelligence</strong>
                    <p>24 级 / AI Student / Cloud Explorer</p>
                  </div>
                </div>
              </section>

              <section id="skills" className="story-scene scene-skills">
                <div className="scene-copy">
                  <p className="section-kicker">Skill Galaxy / 技能星图</p>
                  <h2>标签云、轨道和 Bento 卡片组合展示技能。</h2>
                  <p>
                    不用百分比描述熟练度，而是按编程、AI 模型、Web 与云部署三个方向组织。
                  </p>
                </div>
                <div className="skill-layout">
                  <div className="orbit-card">
                    <div className="orbit-track">
                      {["Python", "PyTorch", "C++", "ML", "ECS", "Nginx"].map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className="orbit-core">
                      <Sparkles size={24} />
                      <strong>AI</strong>
                    </div>
                  </div>
                  <div className="skill-bento">
                    {skillGroups.map((group) => (
                      <article key={group.title} className="bento-tile">
                        <h3>{group.title}</h3>
                        <div>
                          {group.items.map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section id="projects" className="story-scene scene-projects">
                <div className="scene-copy">
                  <p className="section-kicker">Projects / 学习项目</p>
                  <h2>项目内容先写死，后续可按需要后台化。</h2>
                  <p>每张卡片预留简介、技术栈、时间、难点与收获；缺少截图时使用玻璃占位。</p>
                </div>
                <div className="project-strip">
                  {projects.map((project, index) => (
                    <article
                      className="project-card flip-slide-card"
                      key={project.name}
                      tabIndex={0}
                      aria-label={`${project.name} 项目卡片，悬停或聚焦查看收获`}
                    >
                      <div className="flip-slide-inner">
                        <div className="flip-face flip-front">
                          <div className="project-visual">
                            <span>0{index + 1}</span>
                          </div>
                          <p>{project.type}</p>
                          <h3>{project.name}</h3>
                          <small>{project.time}</small>
                          <p>{project.summary}</p>
                          <div className="tag-row">
                            {project.stack.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flip-face flip-back">
                          <p className="flip-label">难点 / 收获</p>
                          <h3>{project.name}</h3>
                          <strong>{project.takeaway}</strong>
                          <div className="tag-row">
                            {project.stack.map((item) => (
                              <span key={item}>{item}</span>
                            ))}
                          </div>
                          <small>Hover / Focus to flip back</small>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section id="blog" className="story-scene scene-blog">
                <div className="scene-copy">
                  <p className="section-kicker">Blog CMS / 学习笔记</p>
                  <h2>博客要做成可长期维护的知识库。</h2>
                  <p>
                    后台支持 Markdown、分类、标签、搜索、草稿、置顶和浏览量。默认栏目先放机器学习、
                    深度学习、云计算和项目复盘。
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
                      <li
                        key={post.title}
                        style={{ "--i": index } as CSSProperties}
                        tabIndex={0}
                      >
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
                    留言默认进入待审核状态，后台账号为 LKDeYu。部署阶段会使用 Ubuntu ECS、
                    Nginx、PM2、SQLite 和 HTTPS，并整理进最终实验报告。
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
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section">
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
      </main>
    </div>
  );
}

function Header({
  isDark,
  menuOpen,
  onNavigate,
  onToggleMenu,
  onToggleTheme,
}: {
  isDark: boolean;
  menuOpen: boolean;
  onNavigate: (href: string) => void;
  onToggleMenu: () => void;
  onToggleTheme: () => void;
}) {
  return (
    <header className="site-header">
      <a className="brand-pill" href="#home" aria-label="返回首页">
        <span />
        NAMRANTA
      </a>
      <nav aria-label="主导航">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.href);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className="menu-button"
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="spatial-menu"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>Menu</span>
        </button>
        <button className="theme-button" type="button" onClick={onToggleTheme}>
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      </div>
    </header>
  );
}

function SpatialMenu({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <aside
      id="spatial-menu"
      className="spatial-menu"
      aria-hidden={!open}
      aria-label="空间导航菜单"
    >
      <div className="spatial-menu-inner">
        <p>Rapid Jump</p>
        <h2>空间菜单</h2>
        <nav>
          {navItems.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.href);
              }}
              style={{ "--i": index } as CSSProperties}
            >
              <span>0{index + 1}</span>
              {item.label}
            </a>
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
