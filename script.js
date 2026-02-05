// ========== ELEMENTS ==========
const noBtn = document.getElementById('no');
const yesBtn = document.getElementById('yes');
const music = document.getElementById('bgm');
const musicBtn = document.getElementById('musicBtn');
const successScreen = document.getElementById('successScreen');

// ========== CONFIGURATION ==========
const CONFIG = {
  CURSOR_SAFETY_RADIUS: 80,
  BUTTON_SAFETY_RADIUS: 60,
  ESCAPE_FORCE: 35,
  MIN_DISTANCE: 100,
  PANIC_DISTANCE: 40,
  BUTTON_SIZE: { width: 160, height: 54 },
  PREDICTION_TIME: 0.15,
  RANDOMNESS: 0.2
};

// ========== STATE ==========
let state = {
  cursorX: window.innerWidth / 2,
  cursorY: window.innerHeight / 2,
  buttonX: 0,
  buttonY: 0,
  mouseVX: 0,
  mouseVY: 0,
  isRunning: true,
  musicPlaying: false,
  animationId: null,
  lastMouseX: window.innerWidth / 2,
  lastMouseY: window.innerHeight / 2,
  lastTime: performance.now()
};

// ========== INIT ==========
function init() {
  positionButtonNextToYes();
  state.animationId = requestAnimationFrame(animate);
  createHearts();
  setupEventListeners();
  createSakuraPetals();
}

function positionButtonNextToYes() {
  const yesRect = yesBtn.getBoundingClientRect();
  state.buttonX = yesRect.right + 20;
  state.buttonY = yesRect.top;
  const padding = 30;
  const maxX = window.innerWidth - CONFIG.BUTTON_SIZE.width - padding;
  const maxY = window.innerHeight - CONFIG.BUTTON_SIZE.height - padding;
  state.buttonX = Math.max(padding, Math.min(maxX, state.buttonX));
  state.buttonY = Math.max(padding, Math.min(maxY, state.buttonY));
  updateButtonPosition();
}

function updateButtonPosition() { 
  noBtn.style.left = `${state.buttonX}px`; 
  noBtn.style.top = `${state.buttonY}px`; 
}

// ========== ANIMATION ==========
function animate() {
  if (!state.isRunning) { 
    state.animationId = null; 
    return; 
  }
  
  const currentTime = performance.now();
  const deltaTime = Math.min((currentTime - state.lastTime) / 16.67, 2);
  state.lastTime = currentTime;
  
  const buttonCenterX = state.buttonX + CONFIG.BUTTON_SIZE.width / 2;
  const buttonCenterY = state.buttonY + CONFIG.BUTTON_SIZE.height / 2;
  const predictedCursorX = state.cursorX + state.mouseVX * CONFIG.PREDICTION_TIME;
  const predictedCursorY = state.cursorY + state.mouseVY * CONFIG.PREDICTION_TIME;
  const dx = predictedCursorX - buttonCenterX;
  const dy = predictedCursorY - buttonCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const edgeToButtonDistance = distance - CONFIG.CURSOR_SAFETY_RADIUS;

  // Escape logic
  if (edgeToButtonDistance < CONFIG.BUTTON_SAFETY_RADIUS) {
    let escapeAngle = Math.atan2(dy, dx) + Math.PI / 2 + (Math.random() - 0.5) * CONFIG.RANDOMNESS;
    const escapeForce = CONFIG.ESCAPE_FORCE * (1 - (edgeToButtonDistance / CONFIG.BUTTON_SAFETY_RADIUS)) * deltaTime;
    state.buttonX += Math.cos(escapeAngle) * escapeForce;
    state.buttonY += Math.sin(escapeAngle) * escapeForce;
  }

  if (edgeToButtonDistance < CONFIG.MIN_DISTANCE) {
    const repulsionForce = (CONFIG.MIN_DISTANCE - edgeToButtonDistance) / CONFIG.MIN_DISTANCE;
    state.buttonX -= (dx / distance) * repulsionForce * 20;
    state.buttonY -= (dy / distance) * repulsionForce * 20;
  }

  if (edgeToButtonDistance < CONFIG.PANIC_DISTANCE) { 
    teleportButtonAway(); 
  }

  const padding = 20;
  state.buttonX = Math.max(padding, Math.min(window.innerWidth - CONFIG.BUTTON_SIZE.width - padding, state.buttonX));
  state.buttonY = Math.max(padding, Math.min(window.innerHeight - CONFIG.BUTTON_SIZE.height - padding, state.buttonY));
  updateButtonPosition();
  state.animationId = requestAnimationFrame(animate);
}

function teleportButtonAway() {
  let attempts = 0, bestSpot = null, bestDistance = 0;
  while (attempts < 10) {
    const testX = 40 + Math.random() * (window.innerWidth - 80 - CONFIG.BUTTON_SIZE.width);
    const testY = 40 + Math.random() * (window.innerHeight - 80 - CONFIG.BUTTON_SIZE.height);
    const testCenterX = testX + CONFIG.BUTTON_SIZE.width / 2;
    const testCenterY = testY + CONFIG.BUTTON_SIZE.height / 2;
    const dx = state.cursorX - testCenterX;
    const dy = state.cursorY - testCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const edgeDistance = distance - CONFIG.CURSOR_SAFETY_RADIUS;
    if (edgeDistance > bestDistance && edgeDistance > 120) { 
      bestDistance = edgeDistance; 
      bestSpot = { x: testX, y: testY }; 
    }
    attempts++;
  }
  if (bestSpot) { 
    state.buttonX = bestSpot.x; 
    state.buttonY = bestSpot.y; 
  }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  // Mouse movement tracking
  document.addEventListener('mousemove', e => {
    const now = performance.now();
    const dt = (now - state.lastTime) || 16;
    state.mouseVX = (e.clientX - state.lastMouseX) / dt * 1000;
    state.mouseVY = (e.clientY - state.lastMouseY) / dt * 1000;
    state.cursorX = e.clientX; 
    state.cursorY = e.clientY;
    state.lastMouseX = e.clientX; 
    state.lastMouseY = e.clientY;
  });

  // Touch movement for mobile
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 0) { 
      state.cursorX = e.touches[0].clientX; 
      state.cursorY = e.touches[0].clientY; 
      e.preventDefault(); 
    }
  }, { passive: false });

  // YES button click
  yesBtn.addEventListener('click', () => {
    state.isRunning = false;
    if (state.animationId) { 
      cancelAnimationFrame(state.animationId); 
      state.animationId = null; 
    }
    noBtn.style.display = 'none'; 
    successScreen.classList.add('show');
    createSuccessConfetti(300); 
    playSuccessSound();
    
    // Auto-play music on success
    if (!state.musicPlaying) {
      music.play().catch(() => {});
      state.musicPlaying = true;
      musicBtn.textContent = '🔊';
    }
  });

  // NO button click - funny responses
  let noClickCount = 0;
  const noResponses = [
    "Are you sure? 😢",
    "Really? 🥺",
    "Think again! 💔",
    "Pleeeease? 🥺",
    "I'll be sad 😭",
    "My heart hurts 💔",
    "You're breaking my heart 💔",
    "Just say yes! 🥺",
    "One more chance? 🥺",
    "Pretty please? 🥺"
  ];

  noBtn.addEventListener('click', () => {
    noClickCount++;
    
    if (noClickCount >= 10) {
      noBtn.textContent = "Okay fine... 🥺";
      noBtn.style.cursor = 'pointer';
      noBtn.onclick = () => {
        // If user finally clicks "Okay fine...", show success screen
        state.isRunning = false;
        if (state.animationId) { 
          cancelAnimationFrame(state.animationId); 
          state.animationId = null; 
        }
        noBtn.style.display = 'none'; 
        successScreen.classList.add('show');
        createSuccessConfetti(300);
        playSuccessSound();
        
        if (!state.musicPlaying) {
          music.play().catch(() => {});
          state.musicPlaying = true;
          musicBtn.textContent = '🔊';
        }
      };
    } else {
      // Change button text based on clicks
      const messageIndex = Math.min(noClickCount - 1, noResponses.length - 1);
      noBtn.textContent = noResponses[messageIndex];
    }
  });

  // Music button control
  musicBtn.addEventListener('click', () => {
    if (state.musicPlaying) { 
      music.pause(); 
      musicBtn.textContent = '🔇'; 
    } else { 
      music.play().catch(() => {}); 
      musicBtn.textContent = '🔊'; 
    }
    state.musicPlaying = !state.musicPlaying;
  });

  // Auto-play music on first click
  document.addEventListener('click', () => {
    if (!state.musicPlaying) { 
      music.play().catch(() => {}); 
      state.musicPlaying = true; 
      musicBtn.textContent = '🔊'; 
    }
  }, { once: true });

  // Window resize handler
  window.addEventListener('resize', () => {
    const padding = 20;
    state.buttonX = Math.max(padding, Math.min(window.innerWidth - CONFIG.BUTTON_SIZE.width - padding, state.buttonX));
    state.buttonY = Math.max(padding, Math.min(window.innerHeight - CONFIG.BUTTON_SIZE.height - padding, state.buttonY));
    updateButtonPosition();
  });
}

// ========== VISUAL EFFECTS ==========
function createHearts() { 
  for (let i = 0; i < 8; i++) { 
    setTimeout(() => createHeart(), i * 400); 
  } 
  setInterval(() => { 
    if (state.isRunning) createHeart(); 
  }, 1500); 
}

function createHeart() { 
  const heart = document.createElement('div'); 
  heart.className = 'heart'; 
  heart.innerHTML = '💖'; 
  heart.style.left = Math.random() * 100 + 'vw'; 
  heart.style.fontSize = (20 + Math.random() * 30) + 'px'; 
  const duration = 4 + Math.random() * 3; 
  heart.style.animationDuration = duration + 's'; 
  document.body.appendChild(heart); 
  setTimeout(() => heart.remove(), duration * 1000); 
}

function createSuccessConfetti(count = 300) { 
  for (let i = 0; i < count; i++) { 
    setTimeout(() => { 
      const confetti = document.createElement('div'); 
      confetti.className = 'confetti'; 
      confetti.style.left = Math.random() * 100 + 'vw'; 
      confetti.style.top = Math.random() * 50 + 'vh'; 
      const colors = ['#ff6b9d', '#ff8fab', '#ffb3c1', '#ffccd5', '#c8b6ff']; 
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]; 
      successScreen.appendChild(confetti); 
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: 1500 + Math.random() * 1500,
        easing: 'cubic-bezier(0.42, 0, 0.58, 1)'
      }).onfinish = () => confetti.remove(); 
    }, i * 10); 
  } 
}

function createSakuraPetals() { 
  const petals = ['🌸', '💮', '🌺', '🌷'];
  setInterval(() => {
    if (!state.isRunning) return; // Stop when success screen shows
    
    const petal = document.createElement('div'); 
    petal.className = 'sakura'; 
    petal.innerText = petals[Math.floor(Math.random() * petals.length)]; 
    petal.style.left = Math.random() * window.innerWidth + 'px'; 
    petal.style.top = '-50px'; 
    petal.style.fontSize = (15 + Math.random() * 25) + 'px'; 
    petal.style.animationDuration = (5 + Math.random() * 5) + 's';
    document.body.appendChild(petal); 
    setTimeout(() => petal.remove(), 8000); 
  }, 300); 
}

function playSuccessSound() { 
  const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'); 
  audio.volume = 0.5; 
  audio.play().catch(() => {}); 
}

// ========== START ==========
window.addEventListener('load', init);
