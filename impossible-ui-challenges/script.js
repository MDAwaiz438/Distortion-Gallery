// --- SLIDE 1: 3D Parallax Card ---
const card = document.getElementById('glassCard');
const glare = document.getElementById('glassGlare');

card.addEventListener('mousemove', e => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Calculate rotation based on mouse distance from center
  const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg
  const rotateY = ((x - centerX) / centerX) * 15;
  
  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  
  // Move the glare
  const percentX = (x / rect.width) * 100;
  const percentY = (y / rect.height) * 100;
  glare.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255,255,255,0.4) 0%, transparent 50%)`;
});

card.addEventListener('mouseleave', () => {
  card.style.transform = `rotateX(0deg) rotateY(0deg)`;
  glare.style.background = `linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.3) 25%, transparent 30%)`;
});


// --- SLIDE 2: Canvas Text Shatter ---
const canvas = document.getElementById('shatterCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouse = { x: -1000, y: -1000, radius: 80 };

function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Draw text to extract pixels
  ctx.fillStyle = '#fff';
  ctx.font = '900 120px Inter';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SHATTER', canvas.width/2, canvas.height/2);
  
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  particles = [];
  const step = 4; // Particle density
  
  for (let y = 0; y < canvas.height; y += step) {
    for (let x = 0; x < canvas.width; x += step) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];
      if (alpha > 128) {
        particles.push({
          x: x, y: y,
          baseX: x, baseY: y,
          vx: 0, vy: 0,
          color: `hsl(${Math.random()*60 + 280}, 100%, 60%)`
        });
      }
    }
  }
}

window.addEventListener('resize', initCanvas);
initCanvas();

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; });

function animateCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];
    
    // Distance to mouse
    let dx = mouse.x - p.x;
    let dy = mouse.y - p.y;
    let dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist < mouse.radius) {
      let force = (mouse.radius - dist) / mouse.radius;
      p.vx -= (dx / dist) * force * 5;
      p.vy -= (dy / dist) * force * 5;
    }
    
    // Spring back to base position
    p.vx += (p.baseX - p.x) * 0.05;
    p.vy += (p.baseY - p.y) * 0.05;
    
    // Friction
    p.vx *= 0.85;
    p.vy *= 0.85;
    
    p.x += p.vx;
    p.y += p.vy;
    
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  
  requestAnimationFrame(animateCanvas);
}
animateCanvas();


// --- SLIDE 4: Squishy Toggle ---
const squishy = document.getElementById('squishyToggle');
squishy.addEventListener('click', () => {
  squishy.classList.toggle('active');
});