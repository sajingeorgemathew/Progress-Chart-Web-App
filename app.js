const phaseList = document.getElementById("phase-list");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const refreshButton = document.getElementById("refresh");
const totalPhasesEl = document.getElementById("total-phases");
const completedPhasesEl = document.getElementById("completed-phases");
const progressPercentEl = document.getElementById("progress-percent");
const ringPercentEl = document.getElementById("ring-percent");
const progressCircle = document.getElementById("progress-circle");

// Particle system
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 80;
    this.connectionDistance = 150;

    this.resize();
    this.init();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw particles
    this.particles.forEach((particle, i) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Bounce off edges
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
      this.ctx.fill();

      // Draw connections
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = particle.x - p2.x;
        const dy = particle.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.3;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(147, 197, 253, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize particle system
const particleCanvas = document.getElementById('particle-canvas');
if (particleCanvas) {
  const particleSystem = new ParticleSystem(particleCanvas);
  particleSystem.animate();
}

// Number animation utility
const animateNumber = (element, start, end, duration = 1000) => {
  const startTime = performance.now();
  const difference = end - start;

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + difference * easeOutQuart);

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

// Update statistics
const updateStats = (data) => {
  const phases = data.phases.filter(p => p.type !== 'week');
  const completed = phases.filter(p => p.status?.toLowerCase() === 'completed');
  const progress = phases.length > 0 ? Math.round((completed.length / phases.length) * 100) : 0;

  // Animate numbers
  setTimeout(() => {
    animateNumber(totalPhasesEl, 0, phases.length, 1200);
    animateNumber(completedPhasesEl, 0, completed.length, 1200);
  }, 300);

  // Animate percentage
  setTimeout(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current <= progress) {
        progressPercentEl.textContent = `${current}%`;
        ringPercentEl.textContent = `${current}%`;
        current++;
      } else {
        clearInterval(interval);
      }
    }, 15);
  }, 400);

  // Animate progress ring
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  // Add SVG gradient if not exists
  if (!document.querySelector('#gradient')) {
    const svg = document.querySelector('.progress-ring');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#3b82f6');

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#8b5cf6');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
  }

  setTimeout(() => {
    progressCircle.style.strokeDashoffset = offset;
  }, 500);
};

// Render phases with enhanced animations
const renderPhases = (data) => {
  pageTitle.textContent = data.title || "Development Phases";
  pageSubtitle.textContent = data.subtitle || "Track what is shipping and what is next.";

  phaseList.innerHTML = "";

  updateStats(data);

  data.phases.forEach((phase, index) => {
    if (phase.type === "week") {
      const week = document.createElement("div");
      week.className = "week-break";
      week.textContent = phase.title;
      week.style.animationDelay = `${index * 0.05}s`;
      phaseList.appendChild(week);
      return;
    }

    const item = document.createElement("article");
    item.className = "phase-item";

    if (phase.status) {
      const status = phase.status.toLowerCase();
      if (status === "completed") {
        item.classList.add("completed");
      } else {
        item.classList.add("incomplete");
      }
    } else {
      item.classList.add("incomplete");
    }

    item.style.animationDelay = `${index * 0.06}s`;

    const header = document.createElement("div");
    header.className = "phase-title";

    const status = (phase.status || "").toLowerCase();
    const percent = Number.isFinite(phase.percent) ? phase.percent : null;
    let statusText = phase.status || phase.tag || "Active";

    if (status === "completed") {
      const completedPercent = percent ?? 100;
      statusText = `${completedPercent}% ✓ Completed`;
    }

    let iconName = "upcoming";
    if (status === "completed") {
      iconName = "completed";
    } else if (status.includes("progress")) {
      iconName = "progress";
    }

    const title = document.createElement("strong");
    title.textContent = phase.title;

    const meta = document.createElement("div");
    meta.className = "phase-meta";

    const statusLabel = document.createElement("span");
    statusLabel.textContent = statusText;

    const icon = document.createElement("img");
    icon.className = "phase-icon";
    icon.src = `assets/${iconName}.png`;
    icon.alt = `${iconName} phase`;

    meta.append(statusLabel, icon);
    header.append(title, meta);

    const body = document.createElement("div");
    body.className = "phase-body";

    const list = document.createElement("ul");
    phase.items.forEach((itemText, itemIndex) => {
      const li = document.createElement("li");
      li.textContent = itemText;
      li.style.opacity = '0';
      li.style.transform = 'translateX(-10px)';
      li.style.transition = 'all 0.3s ease';

      // Stagger list item animations
      setTimeout(() => {
        li.style.opacity = '1';
        li.style.transform = 'translateX(0)';
      }, (index * 60) + (itemIndex * 50) + 400);

      list.appendChild(li);
    });

    body.appendChild(list);
    item.appendChild(header);
    item.appendChild(body);

    // Add 3D tilt effect on mouse move
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = '';
    });

    phaseList.appendChild(item);
  });
};

// Load content with loading animation
const loadContent = async () => {
  refreshButton.disabled = true;
  refreshButton.style.opacity = '0.6';

  try {
    const response = await fetch("content.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load content.");
    }
    const data = await response.json();
    renderPhases(data);
  } catch (error) {
    phaseList.innerHTML = '<div class="phase-item">Unable to load content. Please try again.</div>';
    console.error('Error loading content:', error);
  } finally {
    setTimeout(() => {
      refreshButton.disabled = false;
      refreshButton.style.opacity = '1';
    }, 1000);
  }
};

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Refresh button with animation
refreshButton.addEventListener("click", () => {
  // Spin animation
  const icon = refreshButton.querySelector('.refresh-icon');
  icon.style.animation = 'spin 0.5s ease-in-out';
  setTimeout(() => {
    icon.style.animation = '';
  }, 500);

  loadContent();
});

// Initial load
loadContent();

// Add parallax effect to gradient orbs
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX / window.innerWidth;
  mouseY = e.clientY / window.innerHeight;
});

const animateOrbs = () => {
  const orbs = document.querySelectorAll('.gradient-orb');
  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 0.5;
    const x = (mouseX - 0.5) * 30 * speed;
    const y = (mouseY - 0.5) * 30 * speed;
    orb.style.transform = `translate(${x}px, ${y}px)`;
  });
  requestAnimationFrame(animateOrbs);
};

animateOrbs();

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
