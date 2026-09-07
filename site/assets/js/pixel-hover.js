import * as THREE from "../../node_modules/three/build/three.module.min.js";

const canHover = window.matchMedia("(min-width: 1000px) and (pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canHover && !reduceMotion) {
    const GRID_SIZE = 25;
    const MOUSE_RADIUS = GRID_SIZE * 0.25;
    const STRENGTH = 0.1;
    const RELAXATION = 0.925;
    const attached = new WeakSet();
    const textureCache = new Map();

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.className = "pixel-hover-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
    camera.position.z = 1;

    let field = new Float32Array(4);
    let fieldTexture = createFieldTexture(field, 1, 1);

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: null },
            uDataTexture: { value: fieldTexture },
            uImageSize: { value: new THREE.Vector2(1, 1) },
            uViewport: { value: new THREE.Vector2(1, 1) }
        },
        vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D uTexture;
            uniform sampler2D uDataTexture;
            uniform vec2 uImageSize;
            uniform vec2 uViewport;
            varying vec2 vUv;

            void main() {
                float viewportAspect = uViewport.x / uViewport.y;
                float imageAspect = uImageSize.x / uImageSize.y;
                vec2 coverScale = viewportAspect > imageAspect
                    ? vec2(1.0, imageAspect / viewportAspect)
                    : vec2(viewportAspect / imageAspect, 1.0);
                vec2 imageUv = (vUv - 0.5) * coverScale + 0.5;

                vec4 offset = texture2D(uDataTexture, vUv);
                vec2 shift = 0.015 * offset.rg;
                vec2 split = shift * 0.15;
                float red = texture2D(uTexture, imageUv - shift + split).r;
                float green = texture2D(uTexture, imageUv - shift).g;
                float blue = texture2D(uTexture, imageUv - shift - split).b;
                float alpha = texture2D(uTexture, imageUv - shift).a;
                gl_FragColor = vec4(red, green, blue, alpha);
            }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let target = null;
    let targetImage = null;
    let pointerInside = false;
    let frameId = 0;
    let loadToken = 0;
    let gridX = 1;
    let gridY = 1;
    let renderWidth = 0;
    let renderHeight = 0;
    const mouse = {
        x: 0.5,
        y: 0.5,
        prevX: 0.5,
        prevY: 0.5,
        vX: 0,
        vY: 0
    };

    function createFieldTexture(data, width, height) {
        const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        texture.needsUpdate = true;
        return texture;
    }

    function validImage(image) {
        if (attached.has(image) || image.closest("#header, footer, .spotlight-story__card, .lightbox")) return false;
        if (image.matches("[data-pixel-hover='off'], .item-img--full, .mats-foot-arrow, .footer-adcker-logo-img")) return false;
        const source = image.currentSrc || image.getAttribute("src") || image.dataset.imgWebp || image.dataset.img || "";
        return Boolean(source) && !source.includes("null.jpg") && !source.endsWith(".svg");
    }

    function imageSource(image) {
        const source = image.currentSrc || image.getAttribute("src") || image.dataset.imgWebp || image.dataset.img;
        return source ? new URL(source, document.baseURI).href : "";
    }

    function buildGrid(width, height) {
        if (width >= height) {
            gridY = GRID_SIZE;
            gridX = Math.max(1, Math.round(GRID_SIZE * width / height));
        } else {
            gridX = GRID_SIZE;
            gridY = Math.max(1, Math.round(GRID_SIZE * height / width));
        }

        field = new Float32Array(gridX * gridY * 4);
        fieldTexture.dispose();
        fieldTexture = createFieldTexture(field, gridX, gridY);
        material.uniforms.uDataTexture.value = fieldTexture;
        renderer.domElement.dataset.grid = gridX + "x" + gridY;
    }

    function positionCanvas() {
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > innerHeight) return null;

        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        renderer.domElement.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`;

        if (width !== renderWidth || height !== renderHeight) {
            renderWidth = width;
            renderHeight = height;
            renderer.setSize(width, height, false);
            renderer.domElement.style.width = width + "px";
            renderer.domElement.style.height = height + "px";
            material.uniforms.uViewport.value.set(width, height);
            buildGrid(width, height);
        }

        return rect;
    }

    function updateField() {
        let peak = 0;

        for (let index = 0; index < field.length; index += 4) {
            field[index] *= RELAXATION;
            field[index + 1] *= RELAXATION;
        }

        if (pointerInside) {
            const mouseX = gridX * mouse.x;
            const mouseY = gridY * (1 - mouse.y);
            const maxDistanceSquared = MOUSE_RADIUS * MOUSE_RADIUS;

            for (let y = 0; y < gridY; y += 1) {
                for (let x = 0; x < gridX; x += 1) {
                    const distanceX = mouseX - x;
                    const distanceY = mouseY - y;
                    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
                    if (distanceSquared >= maxDistanceSquared) continue;

                    const power = Math.min(10, MOUSE_RADIUS / Math.sqrt(distanceSquared));
                    const index = 4 * (x + gridX * y);
                    field[index] += STRENGTH * 100 * mouse.vX * power;
                    field[index + 1] -= STRENGTH * 100 * mouse.vY * power;
                }
            }
        }

        for (let index = 0; index < field.length; index += 4) {
            peak = Math.max(peak, Math.abs(field[index]), Math.abs(field[index + 1]));
        }

        mouse.vX *= 0.9;
        mouse.vY *= 0.9;
        fieldTexture.needsUpdate = true;
        return peak;
    }

    function renderFrame() {
        frameId = 0;
        if (!target || !positionCanvas()) {
            stopRendering();
            return;
        }

        const peak = updateField();
        renderer.render(scene, camera);

        if (!pointerInside && peak < 0.001 && Math.abs(mouse.vX) < 0.0001 && Math.abs(mouse.vY) < 0.0001) {
            stopRendering();
            return;
        }

        frameId = requestAnimationFrame(renderFrame);
    }

    function stopRendering() {
        renderer.domElement.classList.remove("is-visible");
        renderer.domElement.removeAttribute("data-active");
        target = null;
        targetImage = null;
        pointerInside = false;
    }

    function startRendering() {
        if (!frameId) frameId = requestAnimationFrame(renderFrame);
    }

    function useTexture(image, token) {
        const source = imageSource(image);
        if (!source) return;

        const ready = function (texture) {
            if (token !== loadToken || targetImage !== image) return;
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            material.uniforms.uTexture.value = texture;
            material.uniforms.uImageSize.value.set(
                texture.image.naturalWidth || texture.image.width,
                texture.image.naturalHeight || texture.image.height
            );
            renderer.domElement.classList.add("is-visible");
            renderer.domElement.dataset.active = image.alt || "image";
            startRendering();
        };

        if (textureCache.has(source)) {
            ready(textureCache.get(source));
            return;
        }

        new THREE.TextureLoader().load(source, function (texture) {
            textureCache.set(source, texture);
            ready(texture);
        });
    }

    function enter(image, hitArea, event) {
        const rect = hitArea.getBoundingClientRect();
        const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1);

        target = hitArea;
        targetImage = image;
        pointerInside = true;
        loadToken += 1;
        renderWidth = 0;
        renderHeight = 0;
        mouse.x = mouse.prevX = x;
        mouse.y = mouse.prevY = y;
        mouse.vX = 0;
        mouse.vY = 0;
        renderer.domElement.style.borderRadius = getComputedStyle(hitArea).borderRadius;
        positionCanvas();
        useTexture(image, loadToken);
        startRendering();
    }

    function move(hitArea, event) {
        if (target !== hitArea) return;
        const rect = hitArea.getBoundingClientRect();
        const x = THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const y = THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height, 0, 1);

        mouse.vX = x - mouse.prevX;
        mouse.vY = y - mouse.prevY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
        mouse.x = x;
        mouse.y = y;
    }

    function attach(image) {
        if (!validImage(image)) return;
        const hitArea = image.closest(".signal-profile__media") || image;
        attached.add(image);
        hitArea.addEventListener("pointerenter", function (event) { enter(image, hitArea, event); });
        hitArea.addEventListener("pointermove", function (event) { move(hitArea, event); });
        hitArea.addEventListener("pointerleave", function () {
            if (target === hitArea) pointerInside = false;
        });
    }

    function scan(root = document) {
        root.querySelectorAll("img").forEach(attach);
    }

    scan();
    new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.nodeType !== 1) return;
                if (node.matches && node.matches("img")) attach(node);
                if (node.querySelectorAll) scan(node);
            });
        });
    }).observe(document.body, { childList: true, subtree: true });
}
