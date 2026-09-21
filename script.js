// ============================================================
// STRATA — shared behavior
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroTrace();
  initResourceFilters();
  initTools();
  initPendingLinks();
});

/* ---------- Mobile nav ---------- */
function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;
 toggle.addEventListener('click', () => {
  const isOpen = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', isOpen);
});
}

/* ---------- Hero seismic trace ---------- */
function initHeroTrace(){
  const canvas = document.getElementById('hero-trace');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize(){
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  const traces = 3;
  const colors = ['#c1602e', '#3f8f86', '#7a5aa8'];
  let t = 0;

  function draw(){
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for(let i = 0; i < traces; i++){
      const baseline = h * (0.28 + i * 0.26);
      ctx.beginPath();
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 1.4 * devicePixelRatio;
      for(let x = 0; x <= w; x += 2){
        const freq = 0.012 + i * 0.004;
        const amp = h * 0.05 * (1 + 0.4 * Math.sin(t * 0.15 + i));
        const y = baseline
          + Math.sin(x * freq + t * 0.6 + i * 2) * amp
          + Math.sin(x * freq * 2.7 + t * 0.9) * amp * 0.3;
        if(x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  if(reduceMotion){
    draw();
    return;
  }

  function loop(){
    t += 0.02;
    draw();
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- Resources page filters ---------- */
function initResourceFilters(){
  const buttons = document.querySelectorAll('.filter-btn');
  const entries = document.querySelectorAll('[data-subject]');
  if(!buttons.length || !entries.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const subject = btn.dataset.filter;
      entries.forEach(entry => {
        const match = subject === 'all' || entry.dataset.subject === subject;
        entry.style.display = match ? '' : 'none';
      });
    });
  });
}

/* ---------- Tools page calculators ---------- */
function initTools(){
  initTravelTimeTool();
  initUnitTool();
  initWaveTool();
}

function initTravelTimeTool(){
  const form = document.getElementById('travel-time-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');

  form.addEventListener('input', () => {
    const velocity = parseFloat(form.velocity.value);   // m/s
    const depth = parseFloat(form.depth.value);          // m
    if(isNaN(velocity) || isNaN(depth) || velocity <= 0 || depth < 0){
      result.textContent = 'Enter velocity and depth to calculate travel time.';
      return;
    }
    // Straight-ray vertical two-way travel time
    const oneWay = depth / velocity;
    const twoWay = oneWay * 2;
    result.textContent =
      `One-way travel time: ${oneWay.toFixed(4)} s  ·  Two-way: ${twoWay.toFixed(4)} s`;
  });
}

function initUnitTool(){
  const form = document.getElementById('unit-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');

  const conversions = {
    gravity: { from: 'mGal', to: 'm/s²', factor: 1e-5 },
    'gravity-rev': { from: 'm/s²', to: 'mGal', factor: 1e5 },
    magnetic: { from: 'nT', to: 'Gauss', factor: 1e-5 },
    'magnetic-rev': { from: 'Gauss', to: 'nT', factor: 1e5 },
    depth: { from: 'm', to: 'ft', factor: 3.28084 },
    'depth-rev': { from: 'ft', to: 'm', factor: 1 / 3.28084 },
    density: { from: 'g/cm³', to: 'kg/m³', factor: 1000 },
    'density-rev': { from: 'kg/m³', to: 'g/cm³', factor: 1 / 1000 },
  };

  form.addEventListener('input', () => {
    const key = form.conversion.value;
    const value = parseFloat(form.value.value);
    const c = conversions[key];
    if(isNaN(value) || !c){
      result.textContent = 'Enter a value to convert.';
      return;
    }
    const out = value * c.factor;
    result.textContent = `${value} ${c.from} = ${out.toPrecision(6)} ${c.to}`;
  });
}

function initWaveTool(){
  const form = document.getElementById('wave-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');

  form.addEventListener('input', () => {
    const velocity = parseFloat(form.velocity.value);   // m/s
    const frequency = parseFloat(form.frequency.value); // Hz
    if(isNaN(velocity) || isNaN(frequency) || frequency <= 0){
      result.textContent = 'Enter velocity and frequency to find wavelength.';
      return;
    }
    const wavelength = velocity / frequency;
    result.textContent = `Wavelength: ${wavelength.toFixed(2)} m`;
  });
}

function initPendingLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.log-link.disabled');
    if (!link) return;

    e.preventDefault();
    alert('Note currently not available yet.');
  });
}