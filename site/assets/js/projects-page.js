(function () {
  "use strict";

  var projects = window.PORTFOLIO_PROJECTS || [];
  var grid = document.querySelector("[data-project-grid]");
  var buttons = document.querySelectorAll(".repo-filter");
  var count = document.querySelector("[data-project-count]");

  function detailUrl(project) {
    return "project-detail.html?repo=" + encodeURIComponent(project.repo);
  }

  function renderCards(list) {
    if (!grid) return;
    if (count) count.textContent = String(list.length).padStart(2, "0") + " projects";
    grid.innerHTML = list
      .map(function (project, index) {
        var projectNumber = String(index + 1).padStart(2, "0");
        return [
          '<a class="repo-card" href="' + detailUrl(project) + '" data-tags="' + project.filterTags + '">',
          '  <div class="repo-card-index"><span>' + projectNumber + '</span><span>view case</span></div>',
          '  <div class="repo-thumb"><img src="' + project.image + '" alt="' + project.title + ' project cover" loading="lazy" decoding="async" /></div>',
          '  <div class="repo-meta">',
          '    <div class="repo-kicker">' + project.category + '</div>',
          '    <h2>' + project.title + '</h2>',
          '    <p>' + project.description + '</p>',
          '    <div class="repo-tags">' + project.tags.map(function (tag) { return "<span>" + tag + "</span>"; }).join("") + "</div>",
          '    <span class="repo-card-arrow" aria-hidden="true">&nearr;</span>',
          "  </div>",
          "</a>"
        ].join("");
      })
      .join("");
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-filter");
      buttons.forEach(function (item) {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      renderCards(
        projects.filter(function (project) {
          return filter === "all" || project.filterTags.indexOf(filter) !== -1;
        })
      );
      window.dispatchEvent(new CustomEvent("portfolio:projects-rendered"));
    });
  });

  renderCards(projects);
  buttons.forEach(function (button) {
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  });
})();
