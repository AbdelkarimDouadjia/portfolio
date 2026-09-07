import * as THREE from "../../node_modules/three/build/three.module.min.js";

export function createSystemVolume(host) {
  if (!host) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch { return null; }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  host.classList.add("is-ready");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const group = new THREE.Group();
  scene.add(group);
  const count = 1000;
  const forms = Array.from({ length: 4 }, () => new Float32Array(count * 3));
  const random = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(i / 200);
    const u = (i % 20) / 19;
    const v = Math.floor(i / 20) % 10 / 9;
    // Four spatial models: network layers, document index, interface surface, build stack.
    forms[0].set([(layer - 2) * 1.8, (u - .5) * (layer === 4 ? 1.2 : 3.5), (v - .5) * 2], i * 3);
    const page = Math.floor(i / 100);
    forms[1].set([(page % 5 - 2) * 1.55 + (u - .5) * 1.1, (Math.floor(page / 5) - .5) * 2.2 + (v - .5) * 1.65, Math.sin(page * .7) * .6], i * 3);
    forms[2].set([(i % 40 / 39 - .5) * 7.6, (Math.floor(i / 40) / 24 - .5) * 4, Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI) * .55], i * 3);
    const unit = Math.floor(i / 250);
    const angle = (i % 4) * Math.PI / 2 + Math.PI / 4;
    forms[3].set([Math.cos(angle) * 1.9, (unit - 1.5) * 1.12 + (u - .5) * .65, Math.sin(angle) * 1.9 * (v * .7 + .3)], i * 3);
  }
  const positions = new Float32Array(forms[0]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("seed", new THREE.Float32BufferAttribute(Array.from({ length: count }, (_, i) => random(i)), 1));
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, mode: { value: 0 }, ratio: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed; uniform float time; uniform float mode; uniform float ratio;
      varying float light; varying float tone;
      void main(){
        vec3 p = position;
        float pulse = pow(.5 + .5 * sin(p.x * 1.4 - time * 2.), 12.);
        p.z += sin(p.x * 1.3 + p.y * 1.2 - time) * .06;
        if(mode > 1.5 && mode < 2.5) p.z += sin(p.x * 1.1 - time) * .28;
        vec4 view = modelViewMatrix * vec4(p,1.);
        gl_Position = projectionMatrix * view;
        gl_PointSize = (1.4 + pulse * 1.5 + seed * .6) * ratio;
        light = .2 + seed * .35 + pulse * .45; tone = pulse;
      }`,
    fragmentShader: `varying float light; varying float tone;
      void main(){ gl_FragColor = vec4(mix(vec3(.86,.9,.9),vec3(.63,1.,.91),tone), light); }`
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);
  const pairs = [];
  for (let layer = 0; layer < 4; layer++) {
    for (let n = 0; n < 22; n++) {
      pairs.push([layer * 200 + n * 9, (layer + 1) * 200 + (n * 27 + 10) % 200]);
    }
  }
  const lineArray = new Float32Array(pairs.length * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(lineArray, 3).setUsage(THREE.DynamicDrawUsage));
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xbedbd4, transparent: true, opacity: .17, depthWrite: false });
  const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
  lines.frustumCulled = false;
  group.add(lines);
  let mode = 0, visible = false, frame = 0, last = 0, elapsed = 0;
  let pointerX = 0, pointerY = 0;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = Math.max(7.5, 15 / camera.aspect);
    camera.updateProjectionMatrix();
    if (reduced) draw(0);
  }
  function draw(dt) {
    const target = forms[mode];
    const mix = reduced ? 1 : 1 - Math.exp(-dt * 4);
    for (let i = 0; i < positions.length; i++) positions[i] += (target[i] - positions[i]) * mix;
    geometry.attributes.position.needsUpdate = true;
    pairs.forEach(([a, b], i) => {
      lineArray.set(positions.subarray(a * 3, a * 3 + 3), i * 6);
      lineArray.set(positions.subarray(b * 3, b * 3 + 3), i * 6 + 3);
    });
    lineGeometry.attributes.position.needsUpdate = true;
    lineMaterial.opacity = mode === 0 ? .17 : mode === 3 ? .1 : .035;
    group.rotation.y += ((reduced ? .2 : Math.sin(elapsed * .16) * .18 + pointerX * .22) - group.rotation.y) * .05;
    group.rotation.x += ((reduced ? -.12 : -.1 + pointerY * .12) - group.rotation.x) * .05;
    material.uniforms.time.value = elapsed;
    renderer.render(scene, camera);
  }
  function animate(now) {
    frame = 0;
    if (!visible || document.hidden || reduced) return;
    const dt = Math.min((now - last) / 1000 || .016, .05);
    last = now; elapsed += dt;
    draw(dt);
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden && !reduced) { last = performance.now(); frame = requestAnimationFrame(animate); }
    else if (visible) draw(0);
  }
  new ResizeObserver(resize).observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  observer.observe(host);
  host.addEventListener("pointermove", event => {
    const rect = host.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  host.addEventListener("pointerleave", () => { pointerX = pointerY = 0; });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pagehide", () => cancelAnimationFrame(frame));
  window.addEventListener("pageshow", sync);
  renderer.domElement.addEventListener("webglcontextlost", event => {
    event.preventDefault(); cancelAnimationFrame(frame); host.classList.remove("is-ready");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => { host.classList.add("is-ready"); sync(); });
  resize(); draw(.016);
  const labels = ["Learning network: input features pass through connected model layers to an output", "Retrieval index: documents arranged into searchable chunks", "Interaction surface: an input propagates across a responsive interface", "Delivery stack: source, checks, build and release assembled into a system"];
  return { setMode(index) {
    mode = index; material.uniforms.mode.value = mode;
    host.setAttribute("aria-label", labels[mode]);
    host.dataset.mode = String(mode);
    if (reduced) draw(0);
  } };
}
