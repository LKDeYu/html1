import type { ProjectRecord, SkillRecord } from "@/lib/portfolio-types";

const now = "2026-05-18T00:00:00.000Z";

export const defaultProjects: ProjectRecord[] = [
  {
    id: "project-douban-top250",
    slug: "douban-top250-crawler",
    name: "豆瓣 Top250 爬虫",
    type: "学习项目",
    time: "课程练习",
    summary: "围绕豆瓣 Top250 电影数据完成采集、解析、清洗和结构化整理，练习从网页信息到可分析数据的完整流程。",
    bodyMarkdown: `## 项目目标

用 Python 完成一个电影数据采集与整理流程，把页面信息转成可保存、可复查、可分析的数据。

## 实现内容

- 获取页面内容并解析电影名称、评分、简介等字段
- 清洗文本并保存为结构化数据
- 记录访问频率、页面结构变化和异常处理

## 收获

这个项目让我把课堂里的 Python 基础和真实网页数据联系起来，也让我更重视访问规则、错误处理和数据清洗质量。`,
    takeaway: "理解了爬虫请求、解析、存储的基本链路，也认识到数据采集必须尊重网站规则和访问频率限制。",
    stack: ["Python", "Web Scraping", "Data Processing"],
    tags: ["Python", "爬虫", "数据处理"],
    status: "published",
    sortOrder: 10,
    updatedAt: now,
  },
  {
    id: "project-coyin",
    slug: "coyin-reader-app",
    name: "Coyin 知页软件开发",
    type: "个人实践",
    time: "学习工具",
    summary: "面向学习和论文阅读的桌面软件设想，整合资料检索、PDF 阅读和计划管理，让学习材料更容易被持续整理。",
    bodyMarkdown: `## 项目目标

把论文阅读、资料检索和学习计划整理到同一个桌面工具中，减少资料分散带来的上下文切换。

## 功能方向

- PDF 阅读与资料整理
- 学习计划和任务拆分
- 面向个人学习流程的界面设计
- 对常用资料建立可追踪的索引

## 收获

这个项目让我开始从“功能能不能做”转向“一个工具是否真的符合日常学习习惯”。`,
    takeaway: "练习把多个学习场景整合进同一个软件界面，关注检索、阅读体验和任务管理之间的协同。",
    stack: ["Desktop App", "PDF Reader", "Planning"],
    tags: ["桌面应用", "PDF", "学习工具"],
    status: "published",
    sortOrder: 20,
    updatedAt: now,
  },
  {
    id: "project-ecg",
    slug: "ecg-diagnosis-system",
    name: "ECG 信号智能诊断系统",
    type: "AI 实验",
    time: "课程与实验",
    summary: "基于 ECG 相关数据和模型训练流程进行智能诊断实验，探索深度学习在医学信号分析中的应用。",
    bodyMarkdown: `## 项目目标

围绕 ECG 信号数据构建一个智能诊断实验流程，理解医学信号项目从数据到模型评估的关键步骤。

## 技术重点

- 医学信号数据预处理
- PyTorch 模型训练与评估
- 指标记录、误差分析和结果表达
- 对医学 AI 项目保持谨慎、可复查的表达方式

## 收获

这个项目让我意识到，模型效果只是其中一部分；数据来源、标注质量、实验复现和结论边界同样重要。`,
    takeaway: "重点练习数据预处理、模型训练、推理评估和医学 AI 项目表达的严谨性。",
    stack: ["Python", "PyTorch", "Deep Learning"],
    tags: ["PyTorch", "深度学习", "医学 AI"],
    status: "published",
    sortOrder: 30,
    updatedAt: now,
  },
];

export const defaultSkills: SkillRecord[] = [
  {
    id: "skill-c-cpp",
    slug: "c-cpp",
    name: "Programming",
    title: "C / C++",
    summary: "用底层语言训练算法思维，理解数据结构、内存和程序执行过程。",
    bodyMarkdown: `## 学习重点

- 数据结构与算法
- 指针、内存和程序执行模型
- C/C++ 基础工程实践

## 当前使用场景

我主要用 C/C++ 训练基础能力，包括刷题、理解底层执行过程，以及为系统和性能方向打基础。`,
    tags: ["C", "C++", "Algorithm"],
    levelLabel: "Foundation",
    status: "published",
    sortOrder: 10,
    updatedAt: now,
  },
  {
    id: "skill-python",
    slug: "python",
    name: "Python",
    title: "Python",
    summary: "用于爬虫、数据处理、模型实验和自动化脚本，是当前学习实践中的主力语言。",
    bodyMarkdown: `## 使用场景

- 数据采集与处理
- 机器学习实验脚本
- 自动化工具
- 项目原型验证

## 学习方式

我会把 Python 放在具体任务里学习：先完成一个能跑通的流程，再逐步整理异常处理、模块组织和可复现记录。`,
    tags: ["Python", "Automation", "Data"],
    levelLabel: "Practical",
    status: "published",
    sortOrder: 20,
    updatedAt: now,
  },
  {
    id: "skill-pytorch",
    slug: "pytorch",
    name: "PyTorch",
    title: "PyTorch",
    summary: "围绕深度学习训练、推理和实验复盘，逐步建立 AI 项目实现能力。",
    bodyMarkdown: `## 学习重点

- Tensor 与自动求导
- Dataset、DataLoader 和训练循环
- 模型评估与实验记录
- 结果可视化和复现

## 当前目标

我希望能把模型训练写得更清晰：数据怎么来、模型怎么训、指标怎么解释、失败样本说明了什么。`,
    tags: ["PyTorch", "AI", "Training"],
    levelLabel: "Learning",
    status: "published",
    sortOrder: 30,
    updatedAt: now,
  },
  {
    id: "skill-machine-learning",
    slug: "machine-learning",
    name: "Machine Learning",
    title: "ML",
    summary: "关注特征、模型、指标和实验流程，把算法知识落到可验证的结果中。",
    bodyMarkdown: `## 学习重点

- 特征工程和数据划分
- 常见模型与评估指标
- 实验对比和复盘
- 过拟合、泛化和误差分析

## 学习态度

机器学习对我来说不是只记模型名称，而是理解每个选择会怎样影响数据、训练和结论。`,
    tags: ["Machine Learning", "Metrics", "Experiment"],
    levelLabel: "Core",
    status: "published",
    sortOrder: 40,
    updatedAt: now,
  },
  {
    id: "skill-deep-learning",
    slug: "deep-learning",
    name: "Deep Learning",
    title: "DL",
    summary: "从神经网络、训练技巧到医学信号分析项目，持续扩展模型理解。",
    bodyMarkdown: `## 学习重点

- 神经网络基础
- 训练技巧和调参
- 医学信号方向实验
- 论文阅读和模型复现

## 当前方向

我会优先把深度学习和具体项目结合起来，避免只停留在概念层面。`,
    tags: ["Deep Learning", "Neural Network", "ECG"],
    levelLabel: "Exploring",
    status: "published",
    sortOrder: 50,
    updatedAt: now,
  },
  {
    id: "skill-cloud-deploy",
    slug: "cloud-deploy",
    name: "Cloud Deploy",
    title: "Cloud",
    summary: "通过 Next.js、MDX、Nginx 和云服务器理解个人网站从开发到上线的完整路径。",
    bodyMarkdown: `## 学习重点

- Next.js 应用结构
- MDX 内容组织
- Linux、Nginx 和进程管理
- 域名、HTTPS 和服务稳定性

## 项目联系

这个网站本身也是我的云端运行练习：内容展示、静态资源、构建部署和服务稳定性都会沉淀成可复查的经验。`,
    tags: ["Next.js", "MDX", "ECS", "Nginx"],
    levelLabel: "Deployment",
    status: "published",
    sortOrder: 60,
    updatedAt: now,
  },
];
