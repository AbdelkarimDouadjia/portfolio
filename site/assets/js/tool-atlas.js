import { createSystemVolume } from "./system-volume.js";
const host = document.querySelector("[data-tool-scene]");
if (host) {
  const volume = createSystemVolume(host.querySelector("[data-system-volume]"));
  const modes = [
    {
      name: "Learning",
      steps: [["Examples", "Python / datasets"], ["Features", "OpenCV / preprocessing"], ["Training", "PyTorch / model fitting"], ["Evaluation", "Scikit-learn / held-out data"]],
      summary: "Turn raw examples into a model, then check what it has learned.",
      foot: "Examples become features. Evidence decides what works."
    },
    {
      name: "Retrieval",
      steps: [["Documents", "Source material"], ["Chunks", "LangChain / text processing"], ["Retrieval", "ChromaDB / relevant context"], ["Answer", "Language model / grounded response"]],
      summary: "Connect a question to relevant source material before generating an answer.",
      foot: "A useful answer starts with the right context."
    },
    {
      name: "Interaction",
      steps: [["Input", "Pointer / keyboard / touch"], ["State", "JavaScript / React"], ["Interface", "HTML / CSS / rendering"], ["Feedback", "GSAP / visual response"]],
      summary: "Translate a person's input into a clear, responsive interface.",
      foot: "Every action should have a clear response."
    },
    {
      name: "Delivery",
      steps: [["Source", "Git / version control"], ["Checks", "Tests / validation"], ["Build", "Dependencies / packaging"], ["Release", "Deployment / verification"]],
      summary: "Keep the path from a code change to a working release repeatable.",
      foot: "A build is only finished when it works where it is used."
    }
  ];
  const buttons = [...document.querySelectorAll("[data-tool-mode]")];
  const rows = [...host.querySelectorAll(".workflow__steps li")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let active = 0;
  let visible = false;
  let timer = 0;

  function highlight(index) {
    active = index;
    rows.forEach((row, i) => row.classList.toggle("is-current", i === active));
  }
  function syncTimer() {
    clearInterval(timer);
    if (visible && !reduced && !document.hidden) timer = setInterval(() => highlight((active + 1) % rows.length), 1500);
  }
  buttons.forEach(button => button.addEventListener("click", () => {
    const mode = modes[Number(button.dataset.toolMode)];
    if (!mode) return;
    volume?.setMode(Number(button.dataset.toolMode));
    buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    host.querySelector("[data-tool-caption]").textContent = button.querySelector("i").textContent + " / " + mode.name.toLowerCase();
    mode.steps.forEach(([title, detail], index) => {
      rows[index].querySelector("strong").textContent = title;
      rows[index].querySelector("small").textContent = detail;
    });
    document.querySelector("[data-tool-summary]").textContent = mode.summary;
    host.querySelector(".workflow__foot").textContent = mode.foot;
    highlight(0);
    syncTimer();
  }));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncTimer();
    }).observe(host);
  } else {
    visible = true;
    syncTimer();
  }
  document.addEventListener("visibilitychange", syncTimer);
  window.addEventListener("pagehide", () => clearInterval(timer));
  window.addEventListener("pageshow", syncTimer);
}
