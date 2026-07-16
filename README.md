# Liquid WebGL Distortion Gallery

An eye-catching, interactive image gallery that uses custom WebGL shaders (via Three.js) to create fluid, mathematical liquid distortion effects during image transitions and mouse hovers.

## Features
- **Pure WebGL Math**: Custom GLSL fragment shaders calculating 2D noise directly on the GPU.
- **Liquid Transitions**: Smoothly "melts" images together based on a dynamic noise threshold.
- **Interactive Hover Ripple**: Localized fluid displacement mapped to mouse coordinates.
- **Glassmorphic UI**: A sleek HTML overlay using `mix-blend-mode: overlay` and CSS backdrop filters.

## Tech Stack
- HTML5 / CSS3 / Vanilla JavaScript
- [Three.js](https://threejs.org/) (for WebGL rendering and geometries)
- [GSAP](https://greensock.com/gsap/) (for uniform transition animations)

## Local Development
To run this project locally, simply open `index.html` in your browser. (Note: Due to CORS policies with WebGL textures, you may need to serve the directory with a local HTTP server like `Live Server` in VSCode).

## Credits
Crafted with ❤️ by **[@awaiz.dev](https://instagram.com/awaiz.dev)**

Follow on Instagram for more "Impossible UI" challenges and advanced web development content!
