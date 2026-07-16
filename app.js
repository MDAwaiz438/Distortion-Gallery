const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D tTexture1;
  uniform sampler2D tTexture2;
  uniform float uProgress;
  uniform vec2 uResolution;
  uniform vec2 uTextureResolution;
  uniform vec2 uMouse;
  uniform float uTime;

  // Simple pseudo-random and noise functions
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  // 2D Noise
  vec2 hash( vec2 p ) {
      p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
  }
  float noise( in vec2 p ) {
      const float K1 = 0.366025404; // (sqrt(3)-1)/2;
      const float K2 = 0.211324865; // (3-sqrt(3))/6;
      vec2  i = floor( p + (p.x+p.y)*K1 );
      vec2  a = p - i + (i.x+i.y)*K2;
      float m = step( a.y, a.x ); 
      vec2  o = vec2( m, 1.0-m );
      vec2  b = a - o + K2;
      vec2  c = a - 1.0 + 2.0*K2;
      vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
      vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
      return dot( n, vec3(70.0) );
  }

  void main() {
    // Correct UV for aspect ratio to prevent image stretching
    vec2 ratio = vec2(
      min((uResolution.x / uResolution.y) / (uTextureResolution.x / uTextureResolution.y), 1.0),
      min((uResolution.y / uResolution.x) / (uTextureResolution.y / uTextureResolution.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Mouse interaction displacement
    float dist = distance(uv, uMouse);
    float mouseHoverEffect = smoothstep(0.4, 0.0, dist); // Radius of ripple
    
    // Liquid distortion math
    float n = noise(uv * 5.0 + uTime * 0.3); // Base fluid movement
    vec2 distortion = vec2(n * 0.3) * uProgress;
    
    // Add mouse hover ripple continuously
    distortion += vec2(sin(uTime * 4.0 + dist * 20.0) * 0.03 * mouseHoverEffect);
    
    // Calculate UVs for transition
    vec2 uv1 = uv + distortion;
    vec2 uv2 = uv - vec2(n * 0.3) * (1.0 - uProgress);

    // Sample textures
    vec4 t1 = texture2D(tTexture1, uv1);
    vec4 t2 = texture2D(tTexture2, uv2);

    // Alpha transition based on noise + progress
    float transitionEdge = uProgress + (n * 0.2);
    float alpha = smoothstep(0.4, 0.6, transitionEdge);

    gl_FragColor = mix(t1, t2, alpha);
  }
`;

class LiquidGallery {
  constructor() {
    this.container = document.getElementById('canvas-container');
    
    this.scene = new THREE.Scene();
    
    // Use orthographic camera for 2D plane rendering
    this.camera = new THREE.OrthographicCamera(
      this.container.offsetWidth / -2, this.container.offsetWidth / 2,
      this.container.offsetHeight / 2, this.container.offsetHeight / -2,
      1, 1000
    );
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // High quality, abstract/fluid images from Unsplash
    this.images = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=1600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1600&auto=format&fit=crop'
    ];
    this.texts = [
      { title: "LUMINOUS", sub: "01 / Ethereal fluid forms" },
      { title: "OBSIDIAN", sub: "02 / Deep space abstraction" },
      { title: "NEON", sub: "03 / Digital light waves" },
      { title: "PRISM", sub: "04 / Chromatic dispersion" }
    ];
    
    this.currentIndex = 0;
    this.textures = [];
    this.isAnimating = false;
    
    this.mouse = new THREE.Vector2(-1000, -1000); // Initialize off-screen
    this.clock = new THREE.Clock();

    this.init();
  }

  async init() {
    const loader = new THREE.TextureLoader();
    // Load all textures
    this.textures = await Promise.all(
      this.images.map(url => new Promise(resolve => loader.load(url, resolve)))
    );

    this.setupMesh();
    this.setupEvents();
    this.render();
  }

  setupMesh() {
    // 1x1 geometry, scaled in render loop
    this.geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
    
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        tTexture1: { value: this.textures[0] },
        tTexture2: { value: this.textures[1] },
        uResolution: { value: new THREE.Vector2(this.container.offsetWidth, this.container.offsetHeight) },
        uTextureResolution: { value: new THREE.Vector2(this.textures[0].image.width, this.textures[0].image.height) },
        uMouse: { value: this.mouse }
      }
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(this.container.offsetWidth, this.container.offsetHeight, 1);
    this.scene.add(this.mesh);
  }

  setupEvents() {
    window.addEventListener('resize', this.onResize.bind(this));
    
    // Track mouse for hover ripples
    document.addEventListener('mousemove', e => {
      // Normalize mouse coordinates to 0.0 -> 1.0 based on viewport
      this.mouse.x = e.clientX / window.innerWidth;
      this.mouse.y = 1.0 - (e.clientY / window.innerHeight); // WebGL Y is flipped
    });

    // Touch support for mobile ripples
    document.addEventListener('touchmove', e => {
      this.mouse.x = e.touches[0].clientX / window.innerWidth;
      this.mouse.y = 1.0 - (e.touches[0].clientY / window.innerHeight);
    });

    document.getElementById('btn-next').addEventListener('click', () => this.navigate(1));
    document.getElementById('btn-prev').addEventListener('click', () => this.navigate(-1));
  }

  navigate(dir) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const nextIndex = (this.currentIndex + dir + this.images.length) % this.images.length;
    
    // Set up textures
    this.material.uniforms.tTexture1.value = this.textures[this.currentIndex];
    this.material.uniforms.tTexture2.value = this.textures[nextIndex];
    
    // Update texture resolution uniform to prevent stretching
    const nextTex = this.textures[nextIndex];
    this.material.uniforms.uTextureResolution.value.set(nextTex.image.width, nextTex.image.height);
    
    // Animate UI text with GSAP
    const title = document.getElementById('title-text');
    const sub = document.getElementById('subtitle-text');
    
    gsap.to([title, sub], {
      y: dir > 0 ? -40 : 40,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        title.textContent = this.texts[nextIndex].title;
        sub.textContent = this.texts[nextIndex].sub;
        gsap.set([title, sub], { y: dir > 0 ? 40 : -40 });
        gsap.to([title, sub], { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1 });
      }
    });

    // Animate shader transition (uProgress from 0 to 1)
    gsap.to(this.material.uniforms.uProgress, {
      value: 1,
      duration: 1.6,
      ease: "power2.inOut",
      onComplete: () => {
        this.currentIndex = nextIndex;
        // Swap back so texture1 is current, prepare for next transition
        this.material.uniforms.tTexture1.value = this.textures[this.currentIndex];
        this.material.uniforms.uProgress.value = 0;
        this.isAnimating = false;
      }
    });
  }

  onResize() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight;
    
    this.renderer.setSize(w, h);
    
    this.camera.left = w / -2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = h / -2;
    this.camera.updateProjectionMatrix();

    this.mesh.scale.set(w, h, 1);
    this.material.uniforms.uResolution.value.set(w, h);
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    
    // Smoothly interpolate mouse position to uniform for softer following
    const currentMouse = this.material.uniforms.uMouse.value;
    currentMouse.x += (this.mouse.x - currentMouse.x) * 0.1;
    currentMouse.y += (this.mouse.y - currentMouse.y) * 0.1;

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LiquidGallery();
});
