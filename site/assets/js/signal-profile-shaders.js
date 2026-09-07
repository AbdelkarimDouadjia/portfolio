export const vertexShaderBase = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShaderBase = `
uniform sampler2D uTexture;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 imageSize, vec2 planeSize) {
    float imageAspect = imageSize.x / imageSize.y;
    float planeAspect = planeSize.x / planeSize.y;
    vec2 scale = vec2(1.0);
    if (planeAspect > imageAspect) { scale.y = imageAspect / planeAspect; }
    else { scale.x = planeAspect / imageAspect; }
    return (uv - 0.5) * scale + 0.5;
}

void main() {
    vec2 uv = coverUv(vUv, uImageSize, uPlaneSize);
    gl_FragColor = texture2D(uTexture, uv);
}
`;

export const vertexShaderCover = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

export const fragmentShaderCover = `
uniform float uProgress;
uniform float uPixelSize;
uniform vec2 uPlaneSize;
uniform sampler2D uChars;
uniform float uCharCount;
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float randomIndex(vec2 id) {
    return floor(random(id) * uCharCount);
}

void main() {
    vec2 gridSize = uPlaneSize / uPixelSize;
    vec2 pixelId = floor(vUv * gridSize);
    vec2 gridUV = pixelId / gridSize;
    float blockRand = random(pixelId);
    float progressY = 1.0 - gridUV.y;
    float rowRand = random(vec2(0.0, pixelId.y));
    float blockReveal = uProgress - (progressY * 0.35 * blockRand + 0.05 * rowRand);

    float blockAlpha = step(blockReveal, 0.0);

    float letterAppearThresholdBase = -0.22;
    float letterAppearThreshold = letterAppearThresholdBase + 0.06 * blockRand;
    float letterShow = smoothstep(letterAppearThreshold, 0.0, blockReveal) * blockAlpha;
    letterShow *= step(0.001, uProgress);

    if (blockAlpha < 0.5) discard;

    vec2 gridFrac = fract(vUv * gridSize);
    float charIndex = randomIndex(pixelId + mod(uProgress * 123.1, 192.6));
    float fontMargin = 0.09 + 0.09 * random(pixelId + uProgress);
    vec2 charUV = vec2(
        gridFrac.x * (1.0 - 2.0 * fontMargin) + fontMargin,
        (charIndex + gridFrac.y) / uCharCount
    );
    vec4 charColor = texture2D(uChars, charUV);
    float letterMask = charColor.r;

    float letterAlpha = step(0.29 + 0.08 * random(pixelId + 333.0), letterMask) * pow(letterShow, 0.69 + 0.3 * random(pixelId + 544.0));

    if (letterAlpha < 0.5 && random(pixelId + uProgress * 7.577) > 0.65) {
        float charIndex2 = mod(charIndex + 1.0, uCharCount);
        vec2 charUV2 = vec2(charUV.x, (charIndex2 + gridFrac.y) / uCharCount);
        vec4 charColor2 = texture2D(uChars, charUV2);
        float letterAlpha2 = step(0.29, charColor2.r) * letterShow;
        letterAlpha = max(letterAlpha, letterAlpha2 * 0.6);
    }

    vec3 grayBase = mix(vec3(0.84, 0.85, 0.91), vec3(0.98, 0.97, 0.94), random(pixelId + 149.0));
    vec3 gray = mix(grayBase, vec3(1.0), 0.15 + 0.26 * random(pixelId + 999.0));

    gl_FragColor = mix(vec4(0.0, 0.0, 0.0, blockAlpha), vec4(gray, blockAlpha), letterAlpha);
}
`;
