(() => {
  const section = document.querySelector('.ambient-story');
  const video = document.getElementById('ambientVideo');
  if (!section || !video || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const mobile = matchMedia('(max-width: 700px), (pointer: coarse)').matches;
  if (mobile) {
    video.loop = true; video.autoplay = true; video.muted = true;
    const start = () => video.play().catch(() => {});
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : video.pause(), {threshold:.05});
    observer.observe(section); video.addEventListener('canplay', start); start(); return;
  }
  let frame = 0; video.pause();
  const sync = () => { frame = 0; if (!Number.isFinite(video.duration) || video.duration <= 0) return; const rect=section.getBoundingClientRect(); const distance=Math.max(1,section.offsetHeight-innerHeight); const progress=Math.min(1,Math.max(0,-rect.top/distance)); video.currentTime=progress*Math.max(0,video.duration-.05); };
  const requestSync=()=>{if(!frame)frame=requestAnimationFrame(sync)};
  video.addEventListener('loadedmetadata',sync); addEventListener('scroll',requestSync,{passive:true}); addEventListener('resize',requestSync); sync();
})();
