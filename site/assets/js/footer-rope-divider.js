(function () {
  "use strict";

  var wrap = document.querySelector(".footer-rope-divider");
  var path = document.querySelector(".footer-rope-path");
  if (!wrap || !path) return;

  var width = 1000;
  var baseY = 45;
  var targetX = 500;
  var targetY = baseY;
  var currentX = 500;
  var currentY = baseY;
  var raf = 0;

  function draw() {
    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.18;
    path.setAttribute("d", "M0 " + baseY + " Q" + currentX.toFixed(2) + " " + currentY.toFixed(2) + " " + width + " " + baseY);
    raf = requestAnimationFrame(draw);
  }

  function move(event) {
    var rect = wrap.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / rect.width) * width;
    var y = ((event.clientY - rect.top) / rect.height) * 90;
    var distance = Math.abs(y - baseY);
    var influence = Math.max(0, 1 - distance / 42);
    var direction = y < baseY ? 1 : -1;
    targetX = Math.max(80, Math.min(width - 80, x));
    targetY = baseY + direction * (18 + influence * 28);
  }

  function rest() {
    targetX = 500;
    targetY = baseY;
  }

  wrap.addEventListener("pointermove", move);
  wrap.addEventListener("pointerleave", rest);
  wrap.addEventListener("pointercancel", rest);

  raf = requestAnimationFrame(draw);

  window.addEventListener("pagehide", function () {
    cancelAnimationFrame(raf);
  });
})();
