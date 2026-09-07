// The legacy appear plugin misses jumps inside the transformed scroll container.
const projectObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.closest(".projects").classList.add("active");
    entry.target.querySelectorAll("[class*='s-'], [class*='p-']").forEach(el => el.classList.add("active"));
    projectObserver.unobserve(entry.target);
  });
}, { threshold: .05 });
document.querySelectorAll(".projects .item-wrap").forEach(el => projectObserver.observe(el));

const section = document.querySelector(".process-study");
if (section && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const { gsap } = await import("../../node_modules/gsap/index.js");
  const items = [...section.querySelectorAll(".process-study__item")];
  const timeline = gsap.timeline({ paused: true });
  items.forEach((item, index) => {
    timeline.fromTo(item.querySelector(".process-study__media"),
      { clipPath: "inset(85% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1, ease: "power2.out" }, index * .2);
    timeline.fromTo(item.querySelector("img"), { scale: 1.18 }, { scale: 1, duration: 1.3, ease: "power2.out" }, index * .2);
  });
  let visible = false, frame = 0;
  function update() {
    frame = 0;
    if (!visible || document.hidden) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight * .85 - rect.top) / (innerHeight * .95)));
    timeline.progress(progress);
    frame = requestAnimationFrame(update);
  }
  function sync() {
    cancelAnimationFrame(frame);
    if (visible && !document.hidden) frame = requestAnimationFrame(update);
  }
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(section);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", () => cancelAnimationFrame(frame));
  window.addEventListener("pageshow", sync);
}
