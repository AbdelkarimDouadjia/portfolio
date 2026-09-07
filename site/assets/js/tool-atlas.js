import * as THREE from "../../node_modules/three/build/three.module.min.js";

const host = document.querySelector("[data-tool-scene]");
if (host) {
  const buttons = [...document.querySelectorAll("[data-tool-mode]")];
  const caption = host.querySelector("[data-tool-caption]");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let selectMode = () => {};
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    caption.textContent = button.querySelector("i").textContent + " / " + button.querySelector("strong").textContent.toLowerCase();
    selectMode(Number(button.dataset.toolMode));
  }));

  try {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.prepend(renderer.domElement);
    host.classList.add("is-ready");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 40);
    camera.position.z = 10;
    const group = new THREE.Group();
    scene.add(group);
    const base = [];
    for (let x = -4; x <= 4; x++) {
      for (let y = -4; y <= 4; y++) {
        for (let z = -4; z <= 4; z++) base.push(new THREE.Vector3(x * .45, y * .45, z * .45));
      }
    }
    const positions = new Float32Array(base.length * 3);
    const colors = new Float32Array(base.length * 3);
    base.forEach((point, i) => {
      point.toArray(positions, i * 3);
      new THREE.Color(i % 31 === 0 ? 0xff713e : i % 19 === 0 ? 0x70c5c5 : 0xe5e5e5).toArray(colors, i * 3);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: .065, vertexColors: true, transparent: true, opacity: .95 });
    group.add(new THREE.Points(geometry, material));
    const frameGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(4.05, 4.05, 4.05));
    const frameMaterial = new THREE.LineBasicMaterial({ color: 0xa8b4b4, transparent: true, opacity: .22 });
    group.add(new THREE.LineSegments(frameGeometry, frameMaterial));
    const scan = new THREE.GridHelper(3.6, 8, 0xff713e, 0xb7c5c5);
    scan.rotation.x = Math.PI / 2;
    scan.material.transparent = true;
    scan.material.opacity = .24;
    group.add(scan);
    let target = base.map(point => point.clone());
    let mode = 0;
    let visible = false;
    let frame = 0;
    let last = 0;
    const pointer = { x: 0, y: 0 };

    selectMode = next => {
      mode = next;
      target = base.map(point => {
        const { x, y, z } = point;
        if (mode === 1) return new THREE.Vector3(x * 1.1, y * .75, z * .6 + Math.sin(y * 3) * .45);
        if (mode === 2) return new THREE.Vector3(x * 1.1, Math.sin(x * 1.4 + z) * .7 + y * .16, z * 1.1);
        if (mode === 3) return new THREE.Vector3(x * .8 + (y > 0 ? .5 : -.5), y, z * .8);
        return point.clone();
      });
      if (reduced) {
        target.forEach((point, i) => point.toArray(positions, i * 3));
        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
      }
    };

    function render(now) {
      if (!visible) return;
      frame = requestAnimationFrame(render);
      if (now - last < 32) return;
      last = now;
      const time = now * .0002;
      scan.position.z = Math.sin(time * 2) * 1.8;
      group.rotation.x += (.26 + pointer.y * .15 - group.rotation.x) * .05;
      group.rotation.y += (-.5 + Math.sin(time) * .25 + pointer.x * .25 - group.rotation.y) * .05;
      target.forEach((point, i) => {
        const wave = mode === 0 ? Math.sin(time * 3 + point.x + point.z) * .05 : 0;
        positions[i * 3] += (point.x - positions[i * 3]) * .09;
        positions[i * 3 + 1] += (point.y + wave - positions[i * 3 + 1]) * .09;
        positions[i * 3 + 2] += (point.z - positions[i * 3 + 2]) * .09;
      });
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    group.rotation.set(.26, -.5, 0);
    const resize = new ResizeObserver(() => {
      const width = host.clientWidth, height = host.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = width < 450 ? 12 : 10;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !reduced;
      cancelAnimationFrame(frame);
      if (visible) frame = requestAnimationFrame(render);
    });
    observer.observe(host);
    host.addEventListener("pointermove", event => {
      const rect = host.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width - .5;
      pointer.y = (event.clientY - rect.top) / rect.height - .5;
    });
    host.addEventListener("pointerleave", () => { pointer.x = 0; pointer.y = 0; });
    renderer.domElement.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      visible = false;
      cancelAnimationFrame(frame);
      host.classList.remove("is-ready");
    });
    window.addEventListener("pagehide", event => {
      if (event.persisted) return;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
      geometry.dispose();
      material.dispose();
      frameGeometry.dispose();
      frameMaterial.dispose();
      scan.geometry.dispose();
      scan.material.dispose();
      renderer.dispose();
    }, { once: true });
  } catch {
    host.classList.remove("is-ready");
  }
}
