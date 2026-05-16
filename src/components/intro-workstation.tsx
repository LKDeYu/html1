import Image from "next/image";

export function IntroWorkstation() {
  return (
    <div className="intro-workstation" aria-label="电脑与桌面反光视觉场景">
      <div className="desk-glow" aria-hidden="true" />
      <div className="workstation-orbit" aria-hidden="true" />
      <div className="monitor-shell">
        <div className="monitor-screen">
          <div className="screen-scan" aria-hidden="true" />
          <Image src="/avatar.png" alt="吴志宏头像" width={112} height={112} priority />
          <div>
            <span>Jiangnan University</span>
            <strong>Zhihong Wu</strong>
            <p>AI Student / Cloud Explorer</p>
          </div>
        </div>
        <div className="monitor-base" />
      </div>
      <div className="keyboard-plane" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <div className="reflection-panel" aria-hidden="true" />
    </div>
  );
}
