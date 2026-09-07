(function () {
  "use strict";

  var projects = window.PORTFOLIO_PROJECTS || [];
  if (!projects.length) return;

  var params = new URLSearchParams(window.location.search);
  var repo = params.get("repo") || projects[0].repo;
  var project = projects.find(function (item) { return item.repo === repo; }) || projects[0];

  var projectBriefs = {
    "Sign-language-detector-python": {
      summary: "A computer vision prototype that connects live hand-sign input to a predicted class. Python brings frame capture, image processing, and classification into one visual workflow.",
      technologies: ["Python", "OpenCV", "Computer Vision", "NumPy", "Model Inference"],
      focus: ["Live visual input", "Hand-sign classification", "Clear model feedback"],
      buildNote: "The project connects the model to visual input, making capture and prediction part of the same interaction.",
      format: "Computer vision prototype",
      role: "Model and interface logic",
      challenge: "Recognize a hand sign from visual input while keeping the detection flow readable and responsive enough for live use.",
      approach: "Use Python tooling around frame capture, image processing, and prediction feedback so the pipeline moves from camera input to model output in one loop.",
      outcome: "A working prototype for testing hand-sign classification with live visual input."
    },
    "H2O_ai-Titanic_Dataset-AutoML": {
      summary: "An AutoML experiment on Kaggle's Titanic dataset, built to compare model candidates quickly and understand how H2O.ai handles tabular survival prediction.",
      technologies: ["Jupyter Notebook", "Python", "H2O.ai", "AutoML", "Kaggle Titanic"],
      focus: ["Automated model search", "Tabular classification", "Fast experiment comparison"],
      buildNote: "One prepared dataset feeds multiple candidate models. The AutoML leaderboard makes their relative performance visible in the same experiment.",
      format: "Notebook experiment",
      role: "ML workflow and comparison",
      challenge: "Move beyond a single manual baseline and compare multiple tabular classification candidates quickly.",
      approach: "Use H2O.ai AutoML to automate model search while keeping the dataset and evaluation path easy to inspect.",
      outcome: "A fast experimentation case that shows how Abdelkarim evaluates model options before choosing a direction."
    },
    "Heart-Disease-Prediction-with-Decision-Trees": {
      summary: "A clinical-risk classification notebook using decision trees to make prediction logic easier to inspect and explain from structured health data.",
      technologies: ["Jupyter Notebook", "Python", "Decision Trees", "Pandas", "scikit-learn"],
      focus: ["Structured health features", "Interpretable classification", "Model evaluation"],
      buildNote: "The decision tree approach fits the project well because the output can be discussed in terms of readable splits, not only accuracy.",
      format: "Health ML notebook",
      role: "Data prep and classifier evaluation",
      challenge: "Build a prediction workflow where the reasoning can be explained from structured clinical-style inputs.",
      approach: "Prepare tabular features, train a decision tree classifier, and keep evaluation visible enough for review.",
      outcome: "A readable healthcare ML exercise that balances model performance with interpretability."
    },
    "handwritten-digit-svm": {
      summary: "A handwritten digit recognition project using support vector machines, centered on feature preparation, classifier training, and evaluation.",
      technologies: ["Jupyter Notebook", "Python", "SVM", "scikit-learn", "Image Features"],
      focus: ["Digit classification", "Feature preprocessing", "Classifier accuracy"],
      buildNote: "The workflow treats digit images as numerical features, then evaluates how well an SVM separates the digit classes.",
      format: "Classification notebook",
      role: "Feature workflow and classifier",
      challenge: "Classify image-like digit data with a classical ML method instead of a heavyweight neural network.",
      approach: "Shape the feature data for support vector machines, train the classifier, and evaluate the recognition behavior.",
      outcome: "A compact proof of classification fundamentals across preprocessing, training, and validation."
    },
    "Titanic-Survival-Prediction-Logistic-Regression": {
      summary: "A classic binary classification workflow for Titanic survival prediction, using logistic regression as a clean baseline model.",
      technologies: ["Jupyter Notebook", "Python", "Logistic Regression", "Pandas", "scikit-learn"],
      focus: ["Feature preparation", "Baseline modeling", "Prediction evaluation"],
      buildNote: "The value here is clarity: simple model, familiar dataset, and a direct path from data preparation to prediction.",
      format: "Baseline ML notebook",
      role: "Feature prep and modeling",
      challenge: "Create a survival prediction baseline that is easy to understand and compare against stronger models.",
      approach: "Clean the Titanic features, apply logistic regression, and keep the evaluation path direct.",
      outcome: "A clean baseline project that makes the modeling process easy to follow."
    },
    "used-car-linear-regression": {
      summary: "A regression notebook for estimating used-car prices from structured vehicle data, with emphasis on preprocessing and model interpretation.",
      technologies: ["Jupyter Notebook", "Python", "Linear Regression", "Pandas", "Data Cleaning"],
      focus: ["Price prediction", "Feature handling", "Regression evaluation"],
      buildNote: "Vehicle attributes become numerical features for a regression model. Data preparation is central to making those price estimates meaningful.",
      format: "Regression notebook",
      role: "Data cleaning and modeling",
      challenge: "Turn noisy vehicle attributes into a price estimate that can be evaluated and explained.",
      approach: "Clean structured data, train a linear regression model, and inspect prediction quality through a simple regression workflow.",
      outcome: "A practical tabular ML project that shows how feature quality shapes prediction quality."
    },
    "Fetcher": {
      summary: "A mixed Python and web utility project for retrieving, organizing, and presenting fetched data through a practical application flow.",
      technologies: ["Python", "JavaScript", "CSS", "HTML", "Data Retrieval"],
      focus: ["Fetch workflow", "Utility backend logic", "Simple web presentation"],
      buildNote: "The utility connects data retrieval with a web interface, keeping the fetched results accessible within an application workflow.",
      format: "Utility web project",
      role: "Backend utility and UI surface",
      challenge: "Make data retrieval feel like a usable workflow instead of a one-off command.",
      approach: "Combine Python utility logic with a lightweight web layer so the fetched data can be organized and presented.",
      outcome: "A backend-oriented project with enough interface structure to make the workflow visible."
    },
    "portfolio": {
      summary: "A personal portfolio codebase focused on interaction, project storytelling, and front-end presentation for Abdelkarim's engineering work.",
      technologies: ["JavaScript", "CSS", "HTML", "Animation", "Responsive UI"],
      focus: ["Portfolio identity", "Interactive sections", "Project navigation"],
      buildNote: "The important signal is craft: visual identity, motion, and clear transitions between selected work and project details.",
      format: "Interactive portfolio",
      role: "Front-end design and motion",
      challenge: "Present technical work with enough identity and motion to feel memorable without hurting usability.",
      approach: "Use focused page structure, responsive sections, and transition details to make the portfolio feel like a cohesive system.",
      outcome: "A stronger portfolio foundation for showing AI, backend, systems, mobile, and front-end work in one place."
    },
    "Grilli-restaurant-website": {
      summary: "A responsive restaurant website exercise with polished layout, menu presentation, and lightweight JavaScript interaction.",
      technologies: ["HTML", "CSS", "JavaScript", "Responsive Layout", "UI Polish"],
      focus: ["Restaurant landing flow", "Visual hierarchy", "Mobile-friendly layout"],
      buildNote: "This is a strong front-end composition piece: the goal is to make the restaurant feel usable, premium, and easy to scan.",
      format: "Responsive website",
      role: "Front-end implementation",
      challenge: "Build a restaurant page that quickly communicates atmosphere, menu structure, and booking intent.",
      approach: "Use responsive layout, visual hierarchy, and lightweight interaction to keep the experience polished across devices.",
      outcome: "A clean front-end project that shows layout discipline and hospitality-style presentation."
    },
    "saas-website-dark-landing-page": {
      summary: "A dark SaaS landing page experiment built around product-style sections, TypeScript structure, and a modern conversion-focused layout.",
      technologies: ["TypeScript", "JavaScript", "CSS", "Dark UI", "Landing Page"],
      focus: ["Product storytelling", "Section rhythm", "Modern web layout"],
      buildNote: "The design direction matters here: controlled contrast, clean spacing, and a sharper product feel than a generic landing page.",
      format: "SaaS landing page",
      role: "Product UI implementation",
      challenge: "Make a dark product landing page feel structured, clear, and modern without relying on generic decoration.",
      approach: "Use TypeScript structure, tight section rhythm, and controlled contrast to support product storytelling.",
      outcome: "A web UI piece that shows product-facing layout and dark interface taste."
    },
    "alx-backend": {
      summary: "A backend engineering collection from the ALX curriculum, covering Python service foundations, APIs, storage patterns, and server-side concepts.",
      technologies: ["Python", "JavaScript", "Shell", "APIs", "Backend Patterns"],
      focus: ["Server-side foundations", "Data handling", "API exercises"],
      buildNote: "A collection of focused exercises covers several backend concepts, with each directory recording a separate implementation task.",
      format: "Backend training archive",
      role: "Server-side exercises",
      challenge: "Build fluency across backend patterns without hiding the practice work behind a single polished demo.",
      approach: "Work through Python, API, storage, and shell-oriented exercises as a broad backend foundation.",
      outcome: "A visible record of backend fundamentals and repeated server-side practice."
    },
    "alx-backend-javascript": {
      summary: "A JavaScript backend practice repository focused on server-side concepts, async flow, API structure, and modern JS foundations.",
      technologies: ["JavaScript", "Node.js", "ES6", "Async Flow", "Backend APIs"],
      focus: ["Backend JavaScript", "Asynchronous code", "Service structure"],
      buildNote: "The cleanest story is progression: moving JavaScript from browser habits into backend logic, modules, and API thinking.",
      format: "Backend JS archive",
      role: "Async backend practice",
      challenge: "Use JavaScript beyond UI code and make async service behavior easier to reason about.",
      approach: "Practice Node-style patterns, modern syntax, async flow, and API-focused exercises.",
      outcome: "A backend JavaScript foundation that complements the Python backend track."
    },
    "alx-low_level_programming": {
      summary: "A low-level programming foundation repository with C exercises, memory work, algorithms, and Unix-oriented problem solving.",
      technologies: ["C", "Pointers", "Memory", "Algorithms", "Shell"],
      focus: ["Systems fundamentals", "Manual memory handling", "Algorithm practice"],
      buildNote: "This archive shows the lower layer of Abdelkarim's engineering base: how programs behave close to memory and the operating system.",
      format: "Systems archive",
      role: "C and algorithms practice",
      challenge: "Strengthen low-level fundamentals where memory, pointers, and program behavior have to be handled directly.",
      approach: "Work through C exercises, algorithms, and Unix-adjacent tasks that expose how software behaves closer to the machine.",
      outcome: "A systems foundation that supports later backend and ML engineering work."
    },
    "simple_shell": {
      summary: "A C implementation of a simple Unix shell, focused on command parsing, process execution, environment handling, and terminal behavior.",
      technologies: ["C", "Unix", "Process Control", "Command Parsing", "Shell"],
      focus: ["Command execution", "Environment handling", "System calls"],
      buildNote: "The project has a strong systems signal because it recreates a core developer tool from first principles.",
      format: "Unix systems project",
      role: "C systems implementation",
      challenge: "Recreate the core behavior of a shell while handling parsing, environment state, and process execution.",
      approach: "Use C and Unix process APIs to move from user input to command execution with a terminal-focused flow.",
      outcome: "A strong systems project that demonstrates practical command-line engineering."
    },
    "Compose-Calculator": {
      summary: "A Kotlin Android calculator built with Jetpack Compose, focused on component structure, state, and mobile UI implementation.",
      technologies: ["Kotlin", "Jetpack Compose", "Android", "State", "Mobile UI"],
      focus: ["Calculator logic", "Composable UI", "Mobile interaction"],
      buildNote: "It is a practical mobile UI piece: small feature scope, but useful for showing clean state-driven interface structure.",
      format: "Android UI project",
      role: "Mobile interface implementation",
      challenge: "Build a focused Android interface where input, state, and output stay predictable.",
      approach: "Use Jetpack Compose components and Kotlin state handling to keep the calculator UI structured.",
      outcome: "A mobile UI exercise that shows component thinking and state-driven interaction."
    },
    "Medicare": {
      summary: "A healthcare-oriented web application project built with PHP, presenting patient-facing product concepts and backend web practice.",
      technologies: ["PHP", "CSS", "JavaScript", "Web App", "Healthcare UI"],
      focus: ["Healthcare workflow", "PHP application logic", "User-facing pages"],
      buildNote: "PHP handles the application layer while CSS and JavaScript shape the patient-facing pages.",
      format: "Healthcare web app",
      role: "PHP app implementation",
      challenge: "Turn healthcare-oriented pages and flows into an application structure that feels usable.",
      approach: "Combine PHP application logic with CSS and JavaScript presentation for patient-facing web screens.",
      outcome: "A web app concept that shows backend practice through a clearer product context."
    }
  };

  function qs(selector) {
    return document.querySelector(selector);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setText(selector, value) {
    var el = qs(selector);
    if (el) el.textContent = value || "";
  }

  function asList(value, fallback) {
    if (Array.isArray(value) && value.length) return value;
    if (Array.isArray(fallback) && fallback.length) return fallback;
    return [];
  }

  function getProjectDetails() {
    return projectBriefs[project.repo] || {
      summary: project.fallbackReadme || project.description,
      technologies: project.tags,
      focus: [project.category + " workflow", "Project implementation", "Source code"],
      buildNote: "The repository contains the implementation and setup instructions for this project.",
      format: "GitHub project",
      role: "Personal build",
      challenge: project.description,
      approach: "Implementation details and examples are available in the linked source repository.",
      outcome: "A public implementation available to explore and run locally."
    };
  }

  function iconSvg(name) {
    var common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    var icons = {
      code: '<svg ' + common + '><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></svg>',
      notebook: '<svg ' + common + '><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M9 4v16"/><path d="M12 8h4"/><path d="M12 12h4"/></svg>',
      brain: '<svg ' + common + '><path d="M9 5a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5.8A3.5 3.5 0 0 0 9 20"/><path d="M15 5a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5.8A3.5 3.5 0 0 1 15 20"/><path d="M9 5v15"/><path d="M15 5v15"/><path d="M9 10h6"/><path d="M9 15h6"/></svg>',
      eye: '<svg ' + common + '><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="3"/></svg>',
      data: '<svg ' + common + '><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7"/></svg>',
      server: '<svg ' + common + '><rect x="4" y="4" width="16" height="6"/><rect x="4" y="14" width="16" height="6"/><path d="M7 7h.01"/><path d="M7 17h.01"/><path d="M11 7h6"/><path d="M11 17h6"/></svg>',
      terminal: '<svg ' + common + '><path d="m5 8 4 4-4 4"/><path d="M11 16h8"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>',
      mobile: '<svg ' + common + '><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 18h4"/></svg>',
      medical: '<svg ' + common + '><path d="M12 3v18"/><path d="M3 12h18"/><path d="M6 6h12v12H6z"/></svg>',
      spark: '<svg ' + common + '><path d="M12 2v5"/><path d="M12 17v5"/><path d="M2 12h5"/><path d="M17 12h5"/><path d="m4.9 4.9 3.5 3.5"/><path d="m15.6 15.6 3.5 3.5"/><path d="m19.1 4.9-3.5 3.5"/><path d="m8.4 15.6-3.5 3.5"/></svg>',
      default: '<svg ' + common + '><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/></svg>'
    };
    return icons[name] || icons.default;
  }

  function iconFor(label) {
    var key = String(label || "").toLowerCase();
    if (/notebook|jupyter/.test(key)) return iconSvg("notebook");
    if (/python|pandas|numpy|kaggle|data|regression/.test(key)) return iconSvg("data");
    if (/ai|ml|model|automl|h2o|decision|svm|scikit|inference/.test(key)) return iconSvg("brain");
    if (/opencv|vision|image|digit/.test(key)) return iconSvg("eye");
    if (/backend|api|node|server|php|fetch/.test(key)) return iconSvg("server");
    if (/shell|unix|process|command|c$|pointers|memory/.test(key)) return iconSvg("terminal");
    if (/kotlin|android|compose|mobile/.test(key)) return iconSvg("mobile");
    if (/health|medical|medicare/.test(key)) return iconSvg("medical");
    if (/animation|responsive|ui|landing|web|html|css|javascript|typescript|es6/.test(key)) return iconSvg("code");
    return iconSvg("spark");
  }

  function renderProjectShell(details) {
    document.title = project.title + " | Abdelkarim Douadjia";
    setText("[data-project-title]", project.title);
    setText("[data-project-category]", project.category);
    setText("[data-project-description]", project.description);
    setText("[data-project-repo]", project.repo);
    setText("[data-project-media-caption]", details.format + " / public GitHub project");

    var hero = qs("[data-project-image]");
    if (hero) {
      hero.src = project.image;
      hero.alt = project.title + " project cover";
    }

    var meta = qs("[data-project-meta]");
    if (meta) {
      meta.innerHTML = [
        ["area", project.category],
        ["format", details.format],
        ["role", details.role]
      ].map(function (item) {
        return "<div><dt>" + escapeHtml(item[0]) + "</dt><dd>" + escapeHtml(item[1]) + "</dd></div>";
      }).join("");
    }

    var tags = qs("[data-project-tags]");
    if (tags) {
      tags.innerHTML = asList(project.tags).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
    }

    var github = qs("[data-project-github]");
    if (github) github.href = project.github;

    var currentIndex = projects.indexOf(project);
    setText("[data-project-index]", String(currentIndex + 1).padStart(2, "0") + " / " + String(projects.length).padStart(2, "0"));
    var next = projects[(currentIndex + 1) % projects.length];
    var nextLink = qs("[data-project-next]");
    if (nextLink) {
      nextLink.href = "project-detail.html?repo=" + encodeURIComponent(next.repo);
      nextLink.textContent = "next: " + next.title;
    }
  }

  function renderProjectBrief(details) {
    setText("[data-project-summary]", details.summary);
    setText("[data-project-build-note]", details.buildNote);

    var techItems = asList(details.technologies, project.tags);
    var tech = qs("[data-project-tech]");
    if (tech) {
      tech.innerHTML = techItems.map(function (item) {
        return '<span class="project-tech-chip"><span class="project-tech-icon">' + iconFor(item) + '</span><span>' + escapeHtml(item) + "</span></span>";
      }).join("");
    }

    var focusItems = asList(details.focus);
    var focus = qs("[data-project-focus]");
    if (focus) {
      focus.innerHTML = focusItems.map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("");
    }

    var signal = qs("[data-project-signal-strip]");
    if (signal) {
      signal.innerHTML = [
        ["stack", techItems.length + " tools"],
        ["core", focusItems[0] || project.category],
        ["repo", project.repo]
      ].map(function (item) {
        return "<div><span>" + escapeHtml(item[0]) + "</span><strong>" + escapeHtml(item[1]) + "</strong></div>";
      }).join("");
    }
  }

  function renderCaseNotes(details) {
    var process = qs("[data-project-process]");
    if (!process) return;

    var items = [
      ["Challenge", details.challenge, "spark"],
      ["Approach", details.approach, "code"],
      ["Outcome", details.outcome, "brain"]
    ];

    process.innerHTML = items.map(function (item, index) {
      return [
        '<article class="project-process-card">',
        '<span class="project-process-index">0' + (index + 1) + "</span>",
        '<span class="project-process-icon">' + iconSvg(item[2]) + "</span>",
        "<h3>" + escapeHtml(item[0]) + "</h3>",
        "<p>" + escapeHtml(item[1]) + "</p>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderProjectFlow(details) {
    var flow = qs("[data-project-flow]");
    if (!flow) return;

    var technologies = asList(details.technologies, project.tags);
    var focus = asList(details.focus);
    var items = [
      ["Input", focus[0] || project.category, "Define the signal and the decision the project needs to support."],
      ["Method", technologies.slice(0, 3).join(" / "), "Use a focused stack so the implementation stays readable, testable, and easy to iterate."],
      ["Delivery", details.format, focus[focus.length - 1] || details.outcome]
    ];

    flow.innerHTML = items.map(function (item, index) {
      return [
        '<article class="project-flow-step">',
        '<span>0' + (index + 1) + '</span>',
        '<h3>' + escapeHtml(item[0]) + '</h3>',
        '<p><strong>' + escapeHtml(item[1]) + '.</strong> ' + escapeHtml(item[2]) + '</p>',
        '</article>'
      ].join("");
    }).join("");
  }

  var details = getProjectDetails();
  renderProjectShell(details);
  renderProjectBrief(details);
  renderProjectFlow(details);
  renderCaseNotes(details);
})();
