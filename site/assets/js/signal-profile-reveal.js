import * as THREE from "../../node_modules/three/build/three.module.min.js";
import gsap from "../../node_modules/gsap/index.js";
import Lenis from "../../node_modules/@studio-freight/lenis/dist/lenis.mjs";
import {
    vertexShaderBase,
    fragmentShaderBase,
    vertexShaderCover,
    fragmentShaderCover
} from "./signal-profile-shaders.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealTargets = [...document.querySelectorAll("[data-signal-reveal]")];

if (!prefersReducedMotion && revealTargets.length) {
    const lenis = new Lenis({
        lerp: 0.09,
        smoothWheel: true,
        smoothTouch: false
    });

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    revealTargets.forEach(initSignalReveal);
}

function initSignalReveal(webglDiv) {
    const img = webglDiv.querySelector("img");
    if (!img) return;
    img.crossOrigin = "anonymous";

    if (!canUseWebGL()) {
        initCanvasRevealFallback(webglDiv, img);
        return;
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    webglDiv.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    let camera = getOrthoCamera(webglDiv.clientWidth, webglDiv.clientHeight);

    const charsData = makeCharsTexture();
    let baseMaterial;
    let coverMaterial;
    let frameId = 0;
    let targetProgress = 0;
    let currentProgress = 0;

    const loader = new THREE.TextureLoader();
    loader.load(
        img.currentSrc || img.src,
        (texture) => {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.needsUpdate = true;

            baseMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uTexture: { value: texture },
                    uImageSize: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
                    uPlaneSize: { value: new THREE.Vector2(1, 1) }
                },
                vertexShader: vertexShaderBase,
                fragmentShader: fragmentShaderBase,
                transparent: false
            });

            coverMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uProgress: { value: 0 },
                    uPixelSize: { value: 18 },
                    uPlaneSize: { value: new THREE.Vector2(1, 1) },
                    uChars: { value: charsData.texture },
                    uCharCount: { value: charsData.count }
                },
                vertexShader: vertexShaderCover,
                fragmentShader: fragmentShaderCover,
                transparent: true
            });

            scene.add(new THREE.Mesh(geometry, baseMaterial), new THREE.Mesh(geometry, coverMaterial));
            resize();
            updateProgress();
            currentProgress = targetProgress;
            coverMaterial.uniforms.uProgress.value = currentProgress;
            img.style.display = "none";
            animate();
        },
        undefined,
        () => {
            img.style.display = "block";
            img.style.opacity = "1";
        }
    );

    function resize() {
        const width = Math.max(1, webglDiv.clientWidth);
        const height = Math.max(1, webglDiv.clientHeight);
        renderer.setSize(width, height, false);
        camera = getOrthoCamera(width, height);
        if (baseMaterial) baseMaterial.uniforms.uPlaneSize.value.set(width, height);
        if (coverMaterial) {
            coverMaterial.uniforms.uPlaneSize.value.set(width, height);
            coverMaterial.uniforms.uPixelSize.value = 16;
        }
    }

    function animate() {
        updateProgress();
        currentProgress += (targetProgress - currentProgress) * 0.1;
        if (coverMaterial) coverMaterial.uniforms.uProgress.value = currentProgress;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
    }

    function updateProgress() {
        targetProgress = getRevealProgress(webglDiv);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });
}

function initCanvasRevealFallback(webglDiv, img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        img.style.display = "block";
        img.style.opacity = "1";
        return;
    }

    webglDiv.appendChild(canvas);

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = img.currentSrc || img.src;

    let frameId = 0;
    let targetProgress = 0;
    let currentProgress = 0;
    let width = 1;
    let height = 1;

    image.onload = () => {
        resize();
        updateProgress();
        currentProgress = targetProgress;
        animate();
    };

    image.onerror = () => {
        img.style.display = "block";
        img.style.opacity = "1";
    };

    function resize() {
        width = Math.max(1, webglDiv.clientWidth);
        height = Math.max(1, webglDiv.clientHeight);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.font = "700 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
    }

    function drawImageCover() {
        const imageRatio = image.width / image.height;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let dx = 0;
        let dy = 0;

        if (canvasRatio > imageRatio) {
            drawHeight = width / imageRatio;
            dy = (height - drawHeight) / 2;
        } else {
            drawWidth = height * imageRatio;
            dx = (width - drawWidth) / 2;
        }

        ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
    }

    function animate() {
        updateProgress();
        currentProgress += (targetProgress - currentProgress) * 0.1;
        renderFallback(currentProgress);
        frameId = requestAnimationFrame(animate);
    }

    function renderFallback(progress) {
        drawImageCover();

        const pixelSize = 16;
        const cols = Math.ceil(width / pixelSize);
        const rows = Math.ceil(height / pixelSize);

        for (let y = 0; y < rows; y += 1) {
            for (let x = 0; x < cols; x += 1) {
                const blockRand = random2(x, y);
                const progressY = 1 - y / rows;
                const rowRand = random2(0, y);
                const blockReveal = progress - (progressY * 0.35 * blockRand + 0.05 * rowRand);
                const blockAlpha = blockReveal <= 0 ? 1 : 0;
                if (blockAlpha < 0.5) continue;

                ctx.fillStyle = "#000";
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize + 0.5, pixelSize + 0.5);

                const letterThreshold = -0.22 + 0.06 * blockRand;
                const letterShow = smoothstep(letterThreshold, 0, blockReveal) * (progress > 0.001 ? 1 : 0);
                if (letterShow <= 0.01) continue;

                const letterMask = random2(x + 333, y + 333);
                if (letterMask < 0.34) continue;

                const charIndex = Math.floor(random2(x + progress * 123.1, y + 192.6) * chars.length);
                const gray = Math.floor(214 + random2(x + 999, y + 149) * 41);
                ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${Math.min(1, letterShow)})`;
                ctx.fillText(chars[charIndex], x * pixelSize + pixelSize / 2, y * pixelSize + pixelSize / 2);
            }
        }
    }

    function updateProgress() {
        targetProgress = getRevealProgress(webglDiv);
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pagehide", () => cancelAnimationFrame(frameId), { once: true });
}

function canUseWebGL() {
    const canvas = document.createElement("canvas");
    return Boolean(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
}

function getRevealProgress(webglDiv) {
    const sequence = webglDiv.closest("[data-signal-sequence]");
    const viewHeight = window.innerHeight || document.documentElement.clientHeight;

    if (sequence) {
        const rect = sequence.getBoundingClientRect();
        const travel = Math.max(1, rect.height - viewHeight);
        const raw = THREE.MathUtils.clamp(-rect.top / travel, 0, 1);
        return Math.sin(Math.PI * raw) * 1.45;
    }

    const rect = webglDiv.getBoundingClientRect();
    const start = viewHeight * 0.3;
    const end = -rect.height + viewHeight * 0.3;
    const raw = (start - rect.top) / (start - end);
    return THREE.MathUtils.clamp(raw, 0, 1) * 1.35;
}

function random2(x, y) {
    return fract(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123);
}

function fract(value) {
    return value - Math.floor(value);
}

function smoothstep(edge0, edge1, x) {
    const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function getOrthoCamera(width, height) {
    const aspect = width / height;
    const frustumHeight = 2;
    const frustumWidth = frustumHeight * aspect;
    const camera = new THREE.OrthographicCamera(
        -frustumWidth / 2,
        frustumWidth / 2,
        frustumHeight / 2,
        -frustumHeight / 2,
        0.1,
        10
    );

    camera.position.z = 1;
    return camera;
}

function makeCharsTexture(chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", fontSize = 96) {
    const canvas = document.createElement("canvas");
    canvas.width = fontSize;
    canvas.height = fontSize * chars.length;

    const ctx = canvas.getContext("2d");
    ctx.font = `bold ${fontSize * 0.55}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < chars.length; i += 1) {
        ctx.clearRect(0, i * fontSize, fontSize, fontSize);
        ctx.fillStyle = Math.random() < 0.35 ? "#dfe7e9" : "#fff7ef";
        ctx.fillText(chars[i], fontSize / 2, (i + 0.5) * fontSize);
    }

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return { texture, count: chars.length };
}
