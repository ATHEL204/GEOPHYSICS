// ============================================================
// STRATA — shared behavior
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Each runs independently: a failure in one must not stop the others.
  [initNav, initHeroTrace, initResourceFilters, initTools, initPendingLinks]
    .forEach(fn => {
      try { fn(); }
      catch (err) { console.error(fn.name + ' failed:', err); }
    });
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
  if(!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if(!ctx) return;
  const reduceMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
        if(match){
          // Restart the fade so it plays on filter, not only on page load
          entry.style.animation = 'none';
          void entry.offsetWidth;
          entry.style.animation = '';
        }
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

// Reads a numeric input by id. Returns NaN when empty or non-numeric.
function numValue(id){
  const el = document.getElementById(id);
  if(!el) return NaN;
  const raw = el.value.trim();
  if(raw === '') return NaN;
  return parseFloat(raw);
}

function initTravelTimeTool(){
  const form = document.getElementById('travel-time-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');

  function update(){
    const velocity = numValue('tt-velocity');   // m/s
    const depth = numValue('tt-depth');         // m

    if(Number.isNaN(velocity) || Number.isNaN(depth)){
      result.textContent = 'Enter velocity and depth to calculate travel time.';
      return;
    }
    if(velocity <= 0){
      result.textContent = 'Velocity must be greater than zero.';
      return;
    }
    if(depth < 0){
      result.textContent = 'Depth cannot be negative.';
      return;
    }

    // Straight-ray, vertical-incidence travel time
    const oneWay = depth / velocity;
    const twoWay = oneWay * 2;
    result.textContent =
      `One-way: ${oneWay.toFixed(4)} s   Two-way: ${twoWay.toFixed(4)} s`;
  }

  form.addEventListener('input', update);
  update();
}

function initUnitTool(){
  const form = document.getElementById('unit-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');
  const select = document.getElementById('unit-conversion');

  const conversions = {
    gravity:        { from: 'mGal',   to: 'm/s\u00B2',  factor: 1e-5 },
    'gravity-rev':  { from: 'm/s\u00B2', to: 'mGal',    factor: 1e5 },
    magnetic:       { from: 'nT',     to: 'Gauss',   factor: 1e-5 },
    'magnetic-rev': { from: 'Gauss',  to: 'nT',      factor: 1e5 },
    depth:          { from: 'm',      to: 'ft',      factor: 3.28084 },
    'depth-rev':    { from: 'ft',     to: 'm',       factor: 1 / 3.28084 },
    density:        { from: 'g/cm\u00B3', to: 'kg/m\u00B3', factor: 1000 },
    'density-rev':  { from: 'kg/m\u00B3', to: 'g/cm\u00B3', factor: 1 / 1000 },
  };

  function update(){
    const key = select ? select.value : null;
    const value = numValue('unit-value');
    const c = conversions[key];

    if(!c){
      result.textContent = 'Choose a conversion.';
      return;
    }
    if(Number.isNaN(value)){
      result.textContent = 'Enter a value to convert.';
      return;
    }

    const out = value * c.factor;
    result.textContent = `${value} ${c.from} = ${formatNumber(out)} ${c.to}`;
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}

function initWaveTool(){
  const form = document.getElementById('wave-tool');
  if(!form) return;
  const result = form.querySelector('.tool-result');

  function update(){
    const velocity = numValue('wave-velocity');    // m/s
    const frequency = numValue('wave-frequency');  // Hz

    if(Number.isNaN(velocity) || Number.isNaN(frequency)){
      result.textContent = 'Enter velocity and frequency to find wavelength.';
      return;
    }
    if(frequency <= 0){
      result.textContent = 'Frequency must be greater than zero.';
      return;
    }
    if(velocity <= 0){
      result.textContent = 'Velocity must be greater than zero.';
      return;
    }

    const wavelength = velocity / frequency;
    // Vertical resolution is commonly taken as a quarter wavelength
    result.textContent =
      `Wavelength: ${wavelength.toFixed(2)} m   Quarter-wavelength: ${(wavelength / 4).toFixed(2)} m`;
  }

  form.addEventListener('input', update);
  update();
}

// Keeps very large and very small results readable.
function formatNumber(n){
  const abs = Math.abs(n);
  if(n !== 0 && (abs < 1e-4 || abs >= 1e7)) return n.toExponential(4);
  return parseFloat(n.toPrecision(6)).toString();
}

function initPendingLinks(){
  document.querySelectorAll('.log-link.disabled').forEach(link => {
    link.setAttribute('aria-disabled', 'true');
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.log-link.disabled');
    if(!link) return;
    e.preventDefault();

    const body = link.closest('.log-body') || link.parentNode;
    let note = body.querySelector('.pending-note');
    if(!note){
      note = document.createElement('span');
      note.className = 'pending-note';
      note.setAttribute('role', 'status');
      note.textContent = 'This note is not written yet.';
      link.insertAdjacentElement('afterend', note);
    }
    note.classList.add('visible');
    clearTimeout(note._timer);
    note._timer = setTimeout(() => note.classList.remove('visible'), 2600);
  });
}