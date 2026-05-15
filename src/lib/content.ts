export const navItems = [
  { label: "首页", href: "#home" },
  { label: "关于我", href: "#about" },
  { label: "技能", href: "#skills" },
  { label: "项目", href: "#projects" },
  { label: "博客", href: "#blog" },
  { label: "留言", href: "#guestbook" },
  { label: "联系", href: "#contact" },
];

export const skillGroups = [
  {
    title: "Programming",
    items: ["C", "C++", "Python"],
  },
  {
    title: "AI & Model",
    items: ["PyTorch", "Machine Learning", "Deep Learning"],
  },
  {
    title: "Web & Cloud",
    items: ["Next.js", "SQLite", "Alibaba Cloud ECS", "Nginx"],
  },
];

export const projects = [
  {
    name: "豆瓣 Top250 爬虫",
    type: "学习项目",
    time: "可补充",
    stack: ["Python", "Web Scraping", "Data Processing"],
    summary:
      "围绕豆瓣 Top250 电影数据进行采集、清洗与结构化整理，练习网络请求、HTML 解析和数据处理流程。",
    takeaway:
      "理解爬虫请求、解析、存储的基本链路，也意识到需要遵守网站规则与访问频率限制。",
  },
  {
    name: "Coyin 知页软件开发",
    type: "学习项目",
    time: "可补充",
    stack: ["Desktop App", "PDF Reader", "Planning"],
    summary:
      "一款面向学习和论文阅读的桌面软件，包含论文检索、PDF 阅读器和计划安排等功能模块。",
    takeaway:
      "练习把多个学习场景整合进同一个软件界面，关注信息检索、阅读体验和任务管理之间的协同。",
  },
  {
    name: "ECG 信号智能诊断系统",
    type: "学习项目",
    time: "可补充",
    stack: ["Python", "PyTorch", "Deep Learning"],
    summary:
      "基于 ECG 相关数据和模型训练流程进行智能诊断实验，探索深度学习在医学信号分析中的应用。",
    takeaway:
      "重点练习数据预处理、模型训练、推理评估和医学 AI 项目表达的严谨性。",
  },
];

export const blogPreview = [
  {
    title: "机器学习笔记",
    category: "机器学习",
    description: "记录模型、特征、评估指标和训练流程中的关键概念。",
  },
  {
    title: "深度学习与 PyTorch",
    category: "深度学习",
    description: "整理神经网络、训练技巧、实验复盘和代码片段。",
  },
  {
    title: "云计算部署日志",
    category: "云计算",
    description: "记录 ECS、Nginx、域名、HTTPS、PM2 与上线流程。",
  },
  {
    title: "项目复盘",
    category: "项目复盘",
    description: "沉淀项目目标、技术选型、问题处理和后续优化计划。",
  },
];
