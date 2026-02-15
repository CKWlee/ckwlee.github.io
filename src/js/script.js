/**
 * Portfolio Website - Main Script
 * Corwin Lee's personal portfolio site
 * 
 * Organized into:
 * 1. Utilities
 * 2. Configuration Constants
 * 3. Feature Modules (Constellation, Navigation, etc.)
 * 4. Page Initializers
 * 5. Main Setup
 */

// ============================================
// UTILITIES
// ============================================
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ============================================
// CONFIGURATION CONSTANTS
// ============================================
const CONFIG = {
    // Constellation Animation
    constellation: {
        particleDensity: 15000,
        particleDensityMobile: 30000,
        connectionDistance: 120,
        particleSpeedRange: 0.4,
        particleMinRadius: 0.5,
        particleMaxRadius: 2.0,
        lineWidth: 0.5,
        mouseRadius: 180,
        mouseRepelForce: 0.08,
        mouseReturnSpeed: 0.02,
        shootingStarInterval: 4000,    // ms between shooting stars
        shootingStarSpeed: 12,
        shootingStarLength: 80,
        pulseSpeed: 0.002,             // Breathing speed for particle radius
    },
    
    // Animation Timings (ms)
    animation: {
        typingSpeed: 80,
        pageTransition: 300,
        introFadeOut: 400,
        pillTransitionDelay: 50,
        modalOpenDelay: 100,
    },
    
    // Timeline
    timeline: {
        scrollDuration: 60,           // Seconds for full scroll cycle
        itemWidth: 320,               // Width including margins
    },
    
    // UI
    ui: {
        navbarHideThreshold: 50,      // Pixels from top to show navbar in modal
    },
    
    // Text Content
    text: {
        introLine1: "Hello, I'm Corwin.",
        introLine2: "I'm a ",
        introRotatingWords: ["developer.", "data nerd.", "film buff.", "problem solver.", "Mavs fan.", "builder."],
        tagline: "Somewhere between the data and the pixels, I make things that feel right.",
    },
};

function getConstellationColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        particle: style.getPropertyValue('--constellation-particle').trim(),
        lineRGB: style.getPropertyValue('--constellation-line').trim()
    };
}

// ============================================
// CONSTELLATION BACKGROUND (Optimized with Spatial Hashing)
// ============================================
function initializeConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;

    // Guard against re-initialization
    if (canvas.dataset.initialized) return;
    canvas.dataset.initialized = 'true';

    const ctx = canvas.getContext('2d');
    let particles = [];
    let shootingStars = [];
    let frameCount = 0;
    
    // Mouse tracking
    const mouse = { x: -1000, y: -1000, active: false };
    
    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    
    setCanvasSize();

    // Mouse event listeners
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.active = true;
    });
    
    document.addEventListener('mouseleave', () => {
        mouse.active = false;
    });

    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            const { particleSpeedRange, particleMinRadius, particleMaxRadius } = CONFIG.constellation;
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = Math.random() * particleSpeedRange - (particleSpeedRange / 2);
            this.vy = Math.random() * particleSpeedRange - (particleSpeedRange / 2);
            this.baseVx = this.vx;
            this.baseVy = this.vy;
            this.baseRadius = Math.random() * (particleMaxRadius - particleMinRadius) + particleMinRadius;
            this.radius = this.baseRadius;
            this.pulseOffset = Math.random() * Math.PI * 2; // Random phase so they don't all pulse in sync
        }

        update() {
            const { mouseRadius, mouseRepelForce, mouseReturnSpeed, pulseSpeed } = CONFIG.constellation;
            
            // Breathing pulse
            this.radius = this.baseRadius + Math.sin(frameCount * pulseSpeed + this.pulseOffset) * 0.4;
            
            // Mouse interaction — gentle drift away from cursor
            if (mouse.active) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < mouseRadius && dist > 0) {
                    const force = (1 - dist / mouseRadius) * mouseRepelForce;
                    this.vx += (dx / dist) * force;
                    this.vy += (dy / dist) * force;
                }
            }
            
            // Gradually return to base velocity
            this.vx += (this.baseVx - this.vx) * mouseReturnSpeed;
            this.vy += (this.baseVy - this.vy) * mouseReturnSpeed;
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Clamp position and ensure correct velocity direction
            if (this.x < 0) { this.x = 0; this.vx = Math.abs(this.vx); }
            else if (this.x > canvas.width) { this.x = canvas.width; this.vx = -Math.abs(this.vx); }
            if (this.y < 0) { this.y = 0; this.vy = Math.abs(this.vy); }
            else if (this.y > canvas.height) { this.y = canvas.height; this.vy = -Math.abs(this.vy); }
        }
    }
    
    // Shooting star class
    class ShootingStar {
        constructor() {
            const { shootingStarSpeed, shootingStarLength } = CONFIG.constellation;
            // Start from a random edge
            const side = Math.random();
            if (side < 0.5) {
                this.x = Math.random() * canvas.width;
                this.y = -10;
            } else {
                this.x = -10;
                this.y = Math.random() * canvas.height * 0.5;
            }
            const angle = Math.PI / 6 + Math.random() * Math.PI / 4; // 30-75 degrees downward
            this.vx = Math.cos(angle) * shootingStarSpeed;
            this.vy = Math.sin(angle) * shootingStarSpeed;
            this.length = shootingStarLength + Math.random() * 40;
            this.life = 1.0;
            this.decay = 0.008 + Math.random() * 0.008;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life -= this.decay;
        }
        
        draw(ctx, rgb) {
            if (this.life <= 0) return;
            const tailX = this.x - (this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy)) * this.length;
            const tailY = this.y - (this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy)) * this.length;
            
            const gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
            gradient.addColorStop(0, `rgba(${rgb}, 0)`);
            gradient.addColorStop(1, `rgba(${rgb}, ${this.life * 0.8})`);
            
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            
            // Bright head
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.life * 0.6})`;
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        isDead() {
            return this.life <= 0 || this.x > canvas.width + 50 || this.y > canvas.height + 50;
        }
    }

    const getDensity = () => {
        const { particleDensity, particleDensityMobile } = CONFIG.constellation;
        return window.innerWidth < 768 ? particleDensityMobile : particleDensity;
    };

    const createParticles = () => {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / getDensity());
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    };
    
    createParticles();

    // Debounced resize: resize canvas + recreate particles
    const handleResize = debounce(() => {
        setCanvasSize();
        createParticles();
    }, 250);
    window.addEventListener('resize', handleResize);

    // Spatial hashing for O(n·k) particle connections instead of O(n²)
    const connectParticles = (colors) => {
        const { connectionDistance, lineWidth } = CONFIG.constellation;
        const maxDistSq = connectionDistance * connectionDistance;
        const cellSize = connectionDistance;
        const cols = Math.ceil(canvas.width / cellSize) + 1;
        const rows = Math.ceil(canvas.height / cellSize) + 1;
        
        // Build spatial grid using object for sparse representation
        const grid = {};
        for (let idx = 0; idx < particles.length; idx++) {
            const p = particles[idx];
            const col = Math.floor(p.x / cellSize);
            const row = Math.floor(p.y / cellSize);
            const key = row * cols + col;
            if (!grid[key]) grid[key] = [];
            grid[key].push(idx);
        }
        
        ctx.lineWidth = lineWidth;
        const rgb = colors.lineRGB;
        
        // For each cell, check current cell + right/bottom neighbors to avoid duplicate pairs
        for (const cellKey in grid) {
            const cellIdx = parseInt(cellKey);
            const cellRow = Math.floor(cellIdx / cols);
            const cellCol = cellIdx % cols;
            const cellParticles = grid[cellKey];
            
            // Neighbor offsets: same cell, right, bottom-left, bottom, bottom-right
            const neighbors = [
                [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]
            ];
            
            for (const [dr, dc] of neighbors) {
                const nr = cellRow + dr;
                const nc = cellCol + dc;
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                
                const neighborKey = nr * cols + nc;
                const neighborParticles = grid[neighborKey];
                if (!neighborParticles) continue;
                
                const isSameCell = dr === 0 && dc === 0;
                
                for (let i = 0; i < cellParticles.length; i++) {
                    const startJ = isSameCell ? i + 1 : 0;
                    for (let j = startJ; j < neighborParticles.length; j++) {
                        const p1 = particles[cellParticles[i]];
                        const p2 = particles[neighborParticles[j]];
                        const dx = p1.x - p2.x;
                        const dy = p1.y - p2.y;
                        const distSq = dx * dx + dy * dy;
                        
                        if (distSq < maxDistSq) {
                            const alpha = 1 - Math.sqrt(distSq) / connectionDistance;
                            ctx.beginPath();
                            ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
                            ctx.moveTo(p1.x, p1.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.stroke();
                        }
                    }
                }
            }
        }
    };

    // Cache theme colors per frame to avoid repeated getComputedStyle calls
    let frameColors = getConstellationColors();
    let colorCacheFrame = 0;

    const getFrameColors = () => {
        // Refresh every 60 frames (~1s) to pick up theme changes
        if (colorCacheFrame++ % 60 === 0) {
            frameColors = getConstellationColors();
        }
        return frameColors;
    };

    const animate = () => {
        if (document.hidden) {
            requestAnimationFrame(animate);
            return;
        }

        frameCount++;
        const colors = getFrameColors();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ── Aurora gradient wash (behind everything) ──
        const t = frameCount * 0.0006;
        const w = canvas.width;
        const h = canvas.height;
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        const aurOpa = isDark ? 0.07 : 0.04;

        // Three orbiting colour pools
        const ax = w * (0.25 + 0.2 * Math.sin(t));
        const ay = h * (0.35 + 0.2 * Math.cos(t * 0.7));
        const bx = w * (0.7 + 0.15 * Math.cos(t * 0.9));
        const by = h * (0.55 + 0.2 * Math.sin(t * 0.6));
        const cx2 = w * (0.5 + 0.25 * Math.sin(t * 1.1 + 2));
        const cy2 = h * (0.2 + 0.15 * Math.cos(t * 0.5 + 1));
        const radius = Math.max(w, h) * 0.45;

        const g1 = ctx.createRadialGradient(ax, ay, 0, ax, ay, radius);
        g1.addColorStop(0, `rgba(139, 92, 246, ${aurOpa})`);
        g1.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, w, h);

        const g2 = ctx.createRadialGradient(bx, by, 0, bx, by, radius * 0.8);
        g2.addColorStop(0, `rgba(59, 130, 246, ${aurOpa * 0.6})`);
        g2.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);

        const g3 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, radius * 0.6);
        g3.addColorStop(0, `rgba(236, 72, 153, ${aurOpa * 0.4})`);
        g3.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, w, h);

        // ── Vignette (subtle darkening at edges) ──
        if (isDark) {
            const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.25)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);
        }
        
        ctx.fillStyle = colors.particle;
        particles.forEach(p => {
            p.update();
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(p.radius, 0.1), 0, Math.PI * 2);
            ctx.fill();
        });
        connectParticles(colors);
        
        // Draw mouse-to-particle connections for a subtle glow effect
        if (mouse.active) {
            const { mouseRadius } = CONFIG.constellation;
            const rgb = colors.lineRGB;
            ctx.lineWidth = 0.3;
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouseRadius) {
                    const alpha = (1 - dist / mouseRadius) * 0.4;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                }
            }
        }
        
        // Update and draw shooting stars
        shootingStars = shootingStars.filter(s => !s.isDead());
        shootingStars.forEach(s => {
            s.update();
            s.draw(ctx, colors.lineRGB);
        });
        
        requestAnimationFrame(animate);
    };
    
    // Periodically spawn shooting stars
    setInterval(() => {
        if (!document.hidden && Math.random() < 0.7) {
            shootingStars.push(new ShootingStar());
        }
    }, CONFIG.constellation.shootingStarInterval);
    
    animate();
}

// ============================================
// HAMBURGER MENU
// ============================================
function initializeHamburgerMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (!hamburger || !navMenu) return;
    
    const toggleMenu = () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
        document.body.classList.toggle('modal-open');
    };
    
    const closeMenu = () => {
        if (navMenu.classList.contains('active')) {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
            document.body.classList.remove('modal-open');
        }
    };

    hamburger.addEventListener("click", toggleMenu);
    
    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

// ============================================
// PORTFOLIO MODAL
// ============================================
function initializePortfolioModal() {
    const portfolioContent = document.querySelector('.portfolio-content');
    if (!portfolioContent) return;

    const modal = document.getElementById('portfolio-modal');
    if (!modal) return;
    
    const navbar = document.querySelector('.navbar');
    const modalCloseBtn = modal.querySelector('.modal-close-btn');
    const modalPrevBtn = modal.querySelector('.modal-nav-prev');
    const modalNextBtn = modal.querySelector('.modal-nav-next');
    const modalMediaContainer = modal.querySelector('.modal-media-container');
    const modalTitle = modal.querySelector('#modal-title');
    const modalTechBreakdown = modal.querySelector('#modal-tech-breakdown');
    const modalUxDesign = modal.querySelector('#modal-ux-design');
    const modalRepoLink = modal.querySelector('#modal-repo-link');

    let projectTiles = [];
    let currentIndex = 0;

    const handleMouseMove = (e) => {
        if (e.clientY < CONFIG.ui.navbarHideThreshold) {
            navbar.classList.remove('hidden-up');
        } else {
            navbar.classList.add('hidden-up');
        }
    };

    function createListFromData(dataString) {
        try {
            const items = JSON.parse(dataString);
            if (!Array.isArray(items)) return '';
            return `<ul>${items.map(item => 
                `<li>${item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
            ).join('')}</ul>`;
        } catch (e) {
            console.error("Failed to parse JSON from data attribute:", e);
            return '';
        }
    }

    function updateModalContent(index) {
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .portfolio-card:not(.portfolio-card-placeholder)'));
        if (!projectTiles.length || !projectTiles[index]) return;
        
        const tile = projectTiles[index];
        currentIndex = index;

        modalTitle.textContent = tile.dataset.title;
        
        modalUxDesign.innerHTML = tile.dataset.uxDesign 
            ? `<h4>UI/UX Design</h4>${createListFromData(tile.dataset.uxDesign)}` 
            : '';
        modalTechBreakdown.innerHTML = tile.dataset.techBreakdown 
            ? `<h4>Technical Breakdown</h4>${createListFromData(tile.dataset.techBreakdown)}` 
            : '';

        const videoSrc = tile.dataset.videoSrc;
        if (videoSrc && (videoSrc.includes('youtube.com/') || videoSrc.includes('youtu.be/'))) {
            modalMediaContainer.innerHTML = `
                <iframe 
                    src="${videoSrc}" 
                    class="youtube-embed" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    loading="lazy"
                ></iframe>`;
        } else {
            modalMediaContainer.innerHTML = `
                <img 
                    src="https://placehold.co/1600x900/1a1a1a/ffffff?text=Video+Coming+Soon" 
                    alt="Project media placeholder" 
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;"
                    loading="lazy"
                >`;
        }

        modalRepoLink.href = tile.dataset.repoLink || '#';
        modalRepoLink.style.display = tile.dataset.repoLink ? 'inline-block' : 'none';
    }

    function openModal(clickedTile) {
        const tiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .portfolio-card:not(.portfolio-card-placeholder)'));
        const index = tiles.indexOf(clickedTile);
        if (index === -1) return;
        
        updateModalContent(index);
        document.body.classList.add('modal-open');
        modal.classList.add('active');
        
        if (navbar) {
            navbar.classList.add('hidden-up');
            document.addEventListener('mousemove', handleMouseMove);
        }
    }

    function closeModal() {
        document.body.classList.remove('modal-open');
        modal.classList.remove('active');
        modalMediaContainer.innerHTML = '';
        
        if (navbar) {
            navbar.classList.remove('hidden-up');
            document.removeEventListener('mousemove', handleMouseMove);
        }
    }

    function showNextProject() {
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .portfolio-card:not(.portfolio-card-placeholder)'));
        if (!projectTiles.length) return;
        updateModalContent((currentIndex + 1) % projectTiles.length);
    }

    function showPrevProject() {
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .portfolio-card:not(.portfolio-card-placeholder)'));
        if (!projectTiles.length) return;
        updateModalContent((currentIndex - 1 + projectTiles.length) % projectTiles.length);
    }

    // Event Listeners
    portfolioContent.addEventListener('click', e => {
        const tile = e.target.closest('.portfolio-card:not(.portfolio-card-placeholder)');
        if (tile) {
            e.preventDefault();
            openModal(tile);
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modalNextBtn.addEventListener('click', showNextProject);
    modalPrevBtn.addEventListener('click', showPrevProject);
    
    document.addEventListener('keydown', e => {
        if (modal.classList.contains('active')) {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'ArrowRight') showNextProject();
            if (e.key === 'ArrowLeft') showPrevProject();
        }
    });
}

// ============================================
// PORTFOLIO FILTER
// ============================================
function initializePortfolioFilter() {
    const nav = document.querySelector('.portfolio-nav');
    if (!nav) return;

    const navPill = nav.querySelector('.portfolio-nav-pill');
    const navLinks = nav.querySelectorAll('.portfolio-nav-link');
    const portfolioSections = document.querySelectorAll('.portfolio-section');

    function movePill(target) {
        if (!target || !navPill) return;
        navPill.style.height = `${target.offsetHeight}px`;
        navPill.style.transform = `translateY(${target.offsetTop}px)`;
        navLinks.forEach(l => l.classList.remove('active'));
        target.classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const currentActive = nav.querySelector('.portfolio-nav-link.active');
            if (currentActive === link) return;

            movePill(link);
            const targetId = link.dataset.target;

            portfolioSections.forEach(section => {
                section.classList.add('hidden');
            });

            const targetSection = document.getElementById(`${targetId}-portfolio`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });

    // Initialize pill position
    const initialActiveLink = nav.querySelector('.portfolio-nav-link.active');
    if (initialActiveLink) {
        setTimeout(() => {
            navPill.style.transition = 'none';
            movePill(initialActiveLink);
            setTimeout(() => {
                navPill.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), height 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
            }, CONFIG.animation.pillTransitionDelay);
        }, 100);
    }
}

// ============================================
// TERMINAL PORTFOLIO (Software & Data)
// ============================================
function initializeTerminalPortfolio() {
    const terminalFiles = document.querySelectorAll('.terminal-file');
    const detailPanel = document.getElementById('terminal-detail-panel');
    if (!terminalFiles.length || !detailPanel) return;

    const titleEl = document.getElementById('terminal-detail-title');
    const descEl = document.getElementById('terminal-detail-desc');
    const techEl = document.getElementById('terminal-detail-tech');
    const repoEl = document.getElementById('terminal-detail-repo');
    const demoEl = document.getElementById('terminal-detail-demo');
    const closeBtn = detailPanel.querySelector('.terminal-detail-close');

    function openDetail(file) {
        // Deselect all
        terminalFiles.forEach(f => f.classList.remove('selected'));
        file.classList.add('selected');

        titleEl.textContent = file.dataset.title;
        descEl.textContent = file.dataset.desc;

        // Tech breakdown
        try {
            const techItems = JSON.parse(file.dataset.techBreakdown);
            techEl.innerHTML = techItems.map(item =>
                `<div class="tech-item">${item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`
            ).join('');
        } catch (e) { techEl.innerHTML = ''; }

        // Links
        const repo = file.dataset.repoLink;
        const video = file.dataset.videoSrc;
        repoEl.href = repo || '#';
        repoEl.classList.toggle('hidden-link', !repo);
        demoEl.href = video || '#';
        demoEl.classList.toggle('hidden-link', !video || video.includes('your_video_id'));

        detailPanel.classList.add('open');
    }

    terminalFiles.forEach(file => {
        file.addEventListener('click', () => openDetail(file));
    });

    closeBtn.addEventListener('click', () => {
        detailPanel.classList.remove('open');
        terminalFiles.forEach(f => f.classList.remove('selected'));
    });
}

// ============================================
// ALBUM DECK (Photography — card shuffle)
// ============================================
function initializeAlbumDecks() {
    const decks = document.querySelectorAll('.album-deck');
    if (!decks.length) return;

    decks.forEach(deck => {
        const cards = deck.querySelectorAll('.album-card');
        const currentEl = deck.querySelector('.album-current');
        const totalEl = deck.querySelector('.album-total');
        if (!cards.length) return;

        let currentIndex = 0;
        totalEl.textContent = cards.length;
        currentEl.textContent = 1;

        // Re-stack cards so top card is last in DOM order (CSS nth-last-child)
        function restackCards() {
            const container = deck.querySelector('.album-cards');
            const arr = Array.from(container.children);
            arr.forEach(card => {
                card.classList.remove('dealing');
                card.style.transform = '';
                card.style.zIndex = '';
            });
        }

        // Deal animation on click (small deck)
        deck.addEventListener('click', (e) => {
            // If it's a double-click or the lightbox trigger, don't deal
            if (e.detail === 2) return;

            if (cards.length <= 1) return;

            const container = deck.querySelector('.album-cards');
            const topCard = container.lastElementChild;

            topCard.classList.add('dealing');

            topCard.addEventListener('animationend', () => {
                topCard.classList.remove('dealing');
                container.prepend(topCard);
                restackCards();

                currentIndex = (currentIndex + 1) % cards.length;
                currentEl.textContent = currentIndex + 1;
            }, { once: true });
        });

        // Double-click to open lightbox
        deck.addEventListener('dblclick', () => {
            openAlbumLightbox(deck);
        });
    });
}

// ============================================
// ALBUM LIGHTBOX
// ============================================
function openAlbumLightbox(deck) {
    const lightbox = document.getElementById('album-lightbox');
    const stage = document.getElementById('album-lightbox-cards');
    const nameEl = document.getElementById('album-lightbox-name');
    const currentEl = document.getElementById('album-lightbox-current');
    const totalEl = document.getElementById('album-lightbox-total');
    if (!lightbox || !stage) return;

    const deckLabel = deck.querySelector('.album-deck-label');
    const originalCards = deck.querySelectorAll('.album-card');
    if (!originalCards.length) return;

    nameEl.textContent = deckLabel ? deckLabel.textContent : '';

    // Clone cards into lightbox
    stage.innerHTML = '';
    originalCards.forEach(card => {
        const clone = document.createElement('div');
        clone.className = 'album-card';
        clone.style.backgroundImage = card.style.backgroundImage;
        stage.appendChild(clone);
    });

    let currentIndex = 0;
    totalEl.textContent = originalCards.length;
    currentEl.textContent = 1;

    const navbar = document.querySelector('.navbar');

    // Click stage to shuffle
    function handleStageShuffle(e) {
        e.stopPropagation();
        const container = stage;
        if (container.children.length <= 1) return;

        const topCard = container.lastElementChild;
        topCard.classList.add('dealing');

        topCard.addEventListener('animationend', () => {
            topCard.classList.remove('dealing');
            container.prepend(topCard);
            // Clear inline styles
            Array.from(container.children).forEach(c => {
                c.classList.remove('dealing');
                c.style.transform = '';
                c.style.zIndex = '';
            });
            currentIndex = (currentIndex + 1) % originalCards.length;
            currentEl.textContent = currentIndex + 1;
        }, { once: true });
    }

    stage.addEventListener('click', handleStageShuffle);

    // Close lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.classList.remove('modal-open');
        if (navbar) navbar.classList.remove('hidden-up');
        stage.removeEventListener('click', handleStageShuffle);
        document.removeEventListener('keydown', handleKey);
    }

    function handleKey(e) {
        if (e.key === 'Escape') closeLightbox();
    }

    const closeBtn = lightbox.querySelector('.album-lightbox-close');
    closeBtn.onclick = (e) => { e.stopPropagation(); closeLightbox(); };
    lightbox.onclick = (e) => { if (e.target === lightbox) closeLightbox(); };
    document.addEventListener('keydown', handleKey);

    // Open
    document.body.classList.add('modal-open');
    lightbox.classList.add('active');
    if (navbar) navbar.classList.add('hidden-up');
}

// ============================================
// VHS SHELF (Videography)
// ============================================
function initializeVHSShelf() {
    const tapes = document.querySelectorAll('.vhs-tape');
    const player = document.getElementById('vhs-player');
    const videoContainer = document.getElementById('vhs-video-container');
    const ejectBtn = document.getElementById('vhs-eject-btn');
    const nowTitle = document.getElementById('vhs-now-title');
    if (!tapes.length || !player) return;

    let currentTape = null;

    function insertTape(tape) {
        // If same tape clicked, eject
        if (currentTape === tape) {
            ejectTape(true);
            return;
        }

        // Eject any current tape first
        if (currentTape) {
            currentTape.classList.remove('inserted');
        }

        currentTape = tape;
        tape.classList.add('inserted');

        // Show player with loading state
        player.classList.remove('active');
        // Force reflow for re-triggering animation
        void player.offsetWidth;
        player.classList.add('loading', 'active');

        const title = tape.querySelector('.vhs-sticker-title')?.textContent || '—';
        nowTitle.textContent = title;

        // Simulate tracking/static, then load video
        setTimeout(() => {
            player.classList.remove('loading');
            const videoSrc = tape.dataset.video;
            if (videoSrc) {
                videoContainer.innerHTML = `
                    <iframe src="${videoSrc}" frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen loading="lazy"></iframe>`;
            }
        }, 1200);
    }

    function ejectTape(animate = true) {
        if (!currentTape) return;

        // Kill iframe
        videoContainer.innerHTML = '';
        nowTitle.textContent = '—';

        if (animate) {
            player.classList.add('loading');
            setTimeout(() => {
                player.classList.remove('active', 'loading');
                currentTape.classList.remove('inserted');
                currentTape = null;
            }, 400);
        } else {
            player.classList.remove('active', 'loading');
            currentTape.classList.remove('inserted');
            currentTape = null;
        }
    }

    tapes.forEach(tape => {
        tape.addEventListener('click', () => insertTape(tape));
    });

    ejectBtn.addEventListener('click', () => ejectTape(true));
}

// ============================================
// TIMELINE ANIMATION
// ============================================
function initializeTimelineAnimation() {
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper || timelineWrapper.dataset.animated) return;

    const timelineItems = timelineWrapper.querySelectorAll('.timeline-item');
    
    // Enforce strict alternating top/bottom across all items (originals + clones)
    timelineItems.forEach((item, i) => {
        item.classList.remove('top', 'bottom');
        item.classList.add(i % 2 === 0 ? 'top' : 'bottom');
    });
    
    // Clone items for infinite scroll effect
    timelineItems.forEach((item, i) => {
        const clone = item.cloneNode(true);
        // Continue the alternation pattern for clones
        clone.classList.remove('top', 'bottom');
        clone.classList.add((timelineItems.length + i) % 2 === 0 ? 'top' : 'bottom');
        timelineWrapper.appendChild(clone);
    });
    
    timelineWrapper.dataset.animated = 'true';

    // Pause on interaction
    const pauseAnimation = () => { timelineWrapper.style.animationPlayState = 'paused'; };
    const resumeAnimation = () => { timelineWrapper.style.animationPlayState = 'running'; };

    timelineWrapper.addEventListener('mousedown', pauseAnimation);
    timelineWrapper.addEventListener('mouseup', resumeAnimation);
    timelineWrapper.addEventListener('mouseleave', resumeAnimation);
    timelineWrapper.addEventListener('touchstart', pauseAnimation);
    timelineWrapper.addEventListener('touchend', resumeAnimation);
}

// ============================================
// RESUME ACCORDION
// ============================================
function initializeAccordion() {
    const headers = document.querySelectorAll('.accordion-header');
    if (!headers.length) return;

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const body = item.querySelector('.accordion-body');
            const isOpen = item.classList.contains('open');

            if (isOpen) {
                // Close
                body.style.maxHeight = body.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    body.style.maxHeight = '0';
                });
                item.classList.remove('open');
                header.setAttribute('aria-expanded', 'false');
            } else {
                // Open
                item.classList.add('open');
                header.setAttribute('aria-expanded', 'true');
                body.style.maxHeight = body.scrollHeight + 'px';

                // Remove max-height after transition so content can reflow
                const onEnd = () => {
                    body.style.maxHeight = 'none';
                    body.removeEventListener('transitionend', onEnd);
                };
                body.addEventListener('transitionend', onEnd);
            }
        });
    });
}

// ============================================
// BIO PUZZLE GAME  (Google Gravity style)
// ============================================
function initializePuzzleGame() {
    const grid = document.getElementById('bio-puzzle-grid');
    const btn  = document.getElementById('puzzle-toggle-btn');
    if (!grid || !btn) return;

    btn.classList.add('visible');

    // Clean up any previous initialization (stale closure from SPA navigation)
    if (btn._puzzleClickHandler) {
        btn.removeEventListener('click', btn._puzzleClickHandler);
        btn._puzzleClickHandler = null;
    }

    let puzzleActive = false;
    let pieces       = [];
    let ghosts       = [];
    let animationId  = null;
    let scrollHandler = null;

    const GRAVITY  = 0.6;
    const BOUNCE   = 0.3;
    const FRICTION = 0.98;
    const TILE_W   = 160;
    const TILE_H   = 70;

    const GHOST_LABELS = [
        'Corwin Lee', 'Things I Love', 'Self-Portrait', 'Just for Fun',
        'Hobbies', 'Outdoors', 'Teams', 'Adventures', 'Philosophy'
    ];

    function getSlotItems() {
        return Array.from(grid.querySelectorAll('[data-puzzle-slot]'));
    }

    function getMaxScroll() {
        const footer = document.querySelector('.site-footer');
        if (footer) return footer.offsetTop - window.innerHeight;
        return document.documentElement.scrollHeight - window.innerHeight;
    }

    // Position the original tile absolutely on top of its ghost
    function seatTileOnGhost(piece) {
        const gr = piece.ghostEl.getBoundingClientRect();
        const gridR = grid.getBoundingClientRect();
        piece.origEl.style.display    = '';
        piece.origEl.style.position   = 'absolute';
        piece.origEl.style.boxSizing  = 'border-box';
        piece.origEl.style.margin     = '0';
        piece.origEl.style.width      = gr.width  + 'px';
        piece.origEl.style.height     = gr.height + 'px';
        piece.origEl.style.left       = (gr.left - gridR.left) + 'px';
        piece.origEl.style.top        = (gr.top  - gridR.top)  + 'px';
        piece.origEl.style.zIndex     = '5';
    }

    // Reset a tile back to normal grid flow
    function resetTileStyle(el) {
        el.style.display    = '';
        el.style.position   = '';
        el.style.boxSizing  = '';
        el.style.margin     = '';
        el.style.width      = '';
        el.style.height     = '';
        el.style.left       = '';
        el.style.top        = '';
        el.style.zIndex     = '';
    }

    /* ---- activate ---- */
    function scatterPuzzle() {
        puzzleActive = true;
        btn.classList.add('active');
        btn.querySelector('.puzzle-btn-text').textContent = 'Finish Puzzle';

        const items = getSlotItems();
        const viewW = window.innerWidth;

        pieces = [];
        ghosts = [];

        // Grid needs position:relative so absolute tiles sit on top of ghosts
        grid.style.position = 'relative';

        // Snapshot every tile rect BEFORE touching the DOM
        const savedRects = items.map(el => {
            const r = el.getBoundingClientRect();
            return { width: r.width, height: r.height, left: r.left, top: r.top };
        });

        items.forEach((el, i) => {
            const saved = savedRects[i];

            // --- Ghost: permanently stays in grid, keeps the structure ---
            const ghost = document.createElement('div');
            ghost.className = 'grid-item puzzle-ghost';
            if (el.classList.contains('large'))  ghost.classList.add('large');
            if (el.classList.contains('wide'))   ghost.classList.add('wide');
            if (el.classList.contains('tall'))   ghost.classList.add('tall');
            ghost.dataset.ghostSlot  = i;
            ghost.dataset.ghostLabel = GHOST_LABELS[i] || 'Tile ' + (i + 1);
            // Force ghost to match original tile's exact height
            ghost.style.minHeight = saved.height + 'px';
            ghost.style.boxSizing = 'border-box';
            el.parentNode.insertBefore(ghost, el);
            ghosts.push(ghost);

            // Hide original tile from flow (ghost takes its grid cell)
            el.style.display = 'none';

            // --- Label tile: starts at original position & size, shrinks then falls ---
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile puzzle-tile-spawning';
            tile.textContent = GHOST_LABELS[i] || 'Tile ' + (i + 1);
            tile.style.left   = saved.left   + 'px';
            tile.style.top    = saved.top    + 'px';
            tile.style.width  = saved.width  + 'px';
            tile.style.height = saved.height + 'px';
            document.body.appendChild(tile);

            pieces.push({
                tile: tile,
                origEl: el,
                slotIdx: i,
                ghostEl: ghost,
                x: saved.left,
                y: saved.top,
                vx: 0,
                vy: 0,
                placed: false,
                dragging: false,
            });
        });

        // Phase 1: smooth shrink from full size → label-card size
        requestAnimationFrame(() => {
            pieces.forEach(p => {
                const saved = savedRects[p.slotIdx];
                const cx = saved.left + saved.width  / 2 - TILE_W / 2;
                const cy = saved.top  + saved.height / 2 - TILE_H / 2;
                p.tile.style.left   = cx + 'px';
                p.tile.style.top    = cy + 'px';
                p.tile.style.width  = TILE_W + 'px';
                p.tile.style.height = TILE_H + 'px';
                p.x = cx;
                p.y = cy;
            });
        });

        // Phase 2: gravity drop after shrink completes
        setTimeout(() => {
            pieces.forEach(p => {
                p.tile.classList.remove('puzzle-tile-spawning');
                p.vx = (Math.random() - 0.5) * 6;
                p.vy = 0;
            });

            simulateGravity();

            pieces.forEach(p => {
                p._onMouseDown  = e => startDrag(e, p);
                p._onTouchStart = e => startDrag(e, p);
                p.tile.addEventListener('mousedown',  p._onMouseDown);
                p.tile.addEventListener('touchstart', p._onTouchStart, { passive: false });
            });
        }, 500);

        // Cap scroll at footer
        scrollHandler = () => {
            if (!puzzleActive) return;
            const max = getMaxScroll();
            if (window.scrollY > max) window.scrollTo(0, max);
        };
        window.addEventListener('scroll', scrollHandler);
    }

    /* ---- physics loop ---- */
    function simulateGravity() {
        const viewW  = window.innerWidth;
        const floorY = window.innerHeight - TILE_H;
        let anyMoving = false;

        pieces.forEach(p => {
            if (p.placed || p.dragging) return;

            p.vy += GRAVITY;
            p.vx *= FRICTION;
            p.vy *= FRICTION;
            p.x  += p.vx;
            p.y  += p.vy;

            if (p.y > floorY)          { p.y = floorY;          p.vy = -p.vy * BOUNCE; if (Math.abs(p.vy) < 0.5) p.vy = 0; }
            if (p.x < 0)              { p.x = 0;              p.vx =  Math.abs(p.vx) * BOUNCE; }
            if (p.x > viewW - TILE_W) { p.x = viewW - TILE_W; p.vx = -Math.abs(p.vx) * BOUNCE; }

            p.tile.style.left = p.x + 'px';
            p.tile.style.top  = p.y + 'px';

            if (Math.abs(p.vx) > 0.1 || Math.abs(p.vy) > 0.1 || p.y < floorY - 1) anyMoving = true;
        });

        animationId = anyMoving ? requestAnimationFrame(simulateGravity) : null;
    }

    /* ---- drag ---- */
    function startDrag(e, piece) {
        if (piece.placed) return;
        e.preventDefault();
        e.stopPropagation();

        piece.dragging = true;
        piece.tile.classList.add('dragging');
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

        const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
        const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
        const offX = cx0 - piece.x;
        const offY = cy0 - piece.y;

        function onMove(ev) {
            ev.preventDefault();
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
            piece.x = cx - offX;
            piece.y = cy - offY;
            piece.vx = 0;
            piece.vy = 0;
            piece.tile.style.left = piece.x + 'px';
            piece.tile.style.top  = piece.y + 'px';
        }

        function onUp() {
            piece.dragging = false;
            piece.tile.classList.remove('dragging');
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onUp);

            const gr = piece.ghostEl.getBoundingClientRect();
            const inside = piece.x >= gr.left &&
                           piece.y >= gr.top  &&
                           piece.x + TILE_W <= gr.right &&
                           piece.y + TILE_H <= gr.bottom;

            if (inside) {
                snapPiece(piece);
            } else {
                piece.vy = 2;
                piece.vx = (Math.random() - 0.5) * 3;
                if (!animationId) simulateGravity();
            }
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onUp);
    }

    /* ---- snap a single piece into its ghost ---- */
    function snapPiece(piece) {
        piece.placed = true;

        // Lock interaction
        piece.tile.removeEventListener('mousedown',  piece._onMouseDown);
        piece.tile.removeEventListener('touchstart', piece._onTouchStart);
        piece.tile.style.pointerEvents = 'none';
        piece.tile.style.cursor = 'default';

        // Ghost rect in viewport coords (matches position:fixed on label tile)
        const gr = piece.ghostEl.getBoundingClientRect();

        // Smooth fly + expand to ghost size
        piece.tile.classList.add('puzzle-tile-returning');
        piece.tile.style.left        = gr.left   + 'px';
        piece.tile.style.top         = gr.top    + 'px';
        piece.tile.style.width       = gr.width  + 'px';
        piece.tile.style.height      = gr.height + 'px';
        piece.tile.style.opacity     = '0';
        piece.tile.style.borderRadius = 'var(--radius-md)';

        // After animation: remove label, seat original tile on ghost
        setTimeout(() => {
            piece.tile.remove();
            seatTileOnGhost(piece);
        }, 500);

        if (pieces.every(p => p.placed)) setTimeout(puzzleComplete, 650);
    }

    /* ---- Thor's hammer: all unplaced tiles fly home ---- */
    function finishPuzzle() {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }

        const unplaced = pieces.filter(p => !p.placed);
        if (unplaced.length === 0) { puzzleComplete(); return; }

        // Mark all as placed so physics stops
        unplaced.forEach(p => {
            p.placed = true;
            p.tile.removeEventListener('mousedown',  p._onMouseDown);
            p.tile.removeEventListener('touchstart', p._onTouchStart);
            p.tile.style.pointerEvents = 'none';
            p.tile.style.cursor = 'default';
        });

        // Stagger the return slightly for a dramatic magnet effect
        unplaced.forEach((p, idx) => {
            setTimeout(() => {
                const gr = p.ghostEl.getBoundingClientRect();
                p.tile.classList.add('puzzle-tile-returning');
                p.tile.style.left        = gr.left   + 'px';
                p.tile.style.top         = gr.top    + 'px';
                p.tile.style.width       = gr.width  + 'px';
                p.tile.style.height      = gr.height + 'px';
                p.tile.style.opacity     = '0';
                p.tile.style.borderRadius = 'var(--radius-md)';

                setTimeout(() => {
                    p.tile.remove();
                    seatTileOnGhost(p);
                }, 500);
            }, idx * 80);  // 80ms stagger between tiles
        });

        // After all tiles land, clean up fully
        const totalDelay = unplaced.length * 80 + 600;
        setTimeout(puzzleComplete, totalDelay);
    }

    /* ---- final cleanup: restore normal grid ---- */
    function puzzleComplete() {
        puzzleActive = false;
        btn.classList.remove('active');
        btn.querySelector('.puzzle-btn-text').textContent = 'Puzzle Mode';

        if (animationId)  { cancelAnimationFrame(animationId); animationId = null; }
        if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null; }

        // Remove leftover label tiles
        pieces.forEach(p => {
            if (p.tile.parentNode) p.tile.remove();
            resetTileStyle(p.origEl);   // back to normal grid flow
        });
        // Remove ghosts (tiles are back in normal flow)
        ghosts.forEach(g => { if (g.parentNode) g.remove(); });
        ghosts = [];
        pieces = [];
        grid.style.position = '';
    }

    /* ---- SPA cleanup ---- */
    function cleanupPuzzleForNav() {
        if (!puzzleActive) return;
        puzzleActive = false;

        if (animationId)  { cancelAnimationFrame(animationId); animationId = null; }
        if (scrollHandler) { window.removeEventListener('scroll', scrollHandler); scrollHandler = null; }

        pieces.forEach(p => {
            if (p.tile.parentNode) p.tile.remove();
            resetTileStyle(p.origEl);
            if (p._onMouseDown)  p.tile.removeEventListener('mousedown',  p._onMouseDown);
            if (p._onTouchStart) p.tile.removeEventListener('touchstart', p._onTouchStart);
        });
        ghosts.forEach(g => { if (g.parentNode) g.remove(); });
        ghosts = [];
        pieces = [];
        grid.style.position = '';

        btn.classList.remove('active');
        const btnText = btn.querySelector('.puzzle-btn-text');
        if (btnText) btnText.textContent = 'Puzzle Mode';
    }

    window._puzzleCleanup = cleanupPuzzleForNav;

    function handlePuzzleClick() {
        if (puzzleActive) finishPuzzle();
        else              scatterPuzzle();
    }

    btn._puzzleClickHandler = handlePuzzleClick;
    btn.addEventListener('click', handlePuzzleClick);
}

// ============================================
// INTERESTS PAGE
// ============================================
function initializeInterestsPage() {
    const interestsMenu = document.getElementById('interests-menu');
    if (!interestsMenu) return;

    const interestCards = interestsMenu.querySelectorAll('.interest-card:not(.disabled)');
    const backButton = document.querySelector('.back-to-menu');
    
    interestCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.dataset.target;
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                interestsMenu.classList.add('hidden');
                targetSection.classList.remove('hidden');
            }
        });
    });

    if (backButton) {
        backButton.addEventListener('click', () => {
            const activeSection = document.querySelector('.main-content section:not(.hidden), .main-content-full-width section:not(.hidden)');
            if (activeSection) activeSection.classList.add('hidden');
            interestsMenu.classList.remove('hidden');
        });
    }
}

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
function initScrollReveal() {
    // Observe grid items & featured tiles (add .reveal dynamically)
    const dynamicItems = document.querySelectorAll('.grid-item:not(.revealed), .project-tile-featured:not(.revealed)');
    // Also observe any elements that already have .reveal in the HTML
    const staticItems = document.querySelectorAll('.reveal:not(.revealed)');
    
    const allItems = new Set([...dynamicItems, ...staticItems]);
    if (!allItems.size) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    
    let i = 0;
    allItems.forEach(item => {
        item.style.animationDelay = `${(i % 10) * 0.07}s`;
        item.classList.add('reveal');
        observer.observe(item);
        i++;
    });
}

// ============================================
// THEME TOGGLE
// ============================================
function initializeThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;

    // Prevent duplicate listeners on SPA navigation
    if (toggle.dataset.initialized) return;
    toggle.dataset.initialized = 'true';

    toggle.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ============================================
// PAGE INITIALIZERS
// ============================================
function initializePageScripts() {
    initializeConstellation();
    initializeThemeToggle();
    initializePortfolioModal();
    initializeTimelineAnimation(); 
    initializeAccordion();
    initializeInterestsPage();
    initializePortfolioFilter();
    initializeTerminalPortfolio();
    initializeAlbumDecks();
    initializeVHSShelf();
    initializeHamburgerMenu();
    initializePuzzleGame();
    initScrollReveal();
    
    // Hide puzzle button if not on bio page
    const puzzleBtn = document.getElementById('puzzle-toggle-btn');
    if (puzzleBtn) {
        const onBioPage = !!document.getElementById('bio-puzzle-grid');
        if (onBioPage) {
            puzzleBtn.classList.add('visible');
        } else {
            puzzleBtn.classList.remove('visible');
        }
    }
}

// ============================================
// MAIN SETUP
// ============================================
function setupPage() {
    const navMenu = document.querySelector('.nav-menu');
    const navPill = document.querySelector('.nav-pill');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const getMainContent = () => document.querySelector('main');

    function movePill(target) {
        if (!target || !navPill) return;
        navPill.style.width = `${target.offsetWidth}px`;
        navPill.style.transform = `translateX(${target.offsetLeft}px)`;
        navLinks.forEach(link => link.classList.remove('active'));
        target.classList.add('active');
    }

    async function loadPage(url) {
        // Clean up puzzle game if active before navigating
        if (window._puzzleCleanup) {
            window._puzzleCleanup();
            window._puzzleCleanup = null;
        }
        
        const mainContent = getMainContent();
        if (mainContent) mainContent.classList.add('is-leaving');
        
        return new Promise(resolve => {
            setTimeout(async () => {
                try {
                    const response = await fetch(url);
                    const text = await response.text();
                    const parser = new DOMParser();
                    const newDoc = parser.parseFromString(text, 'text/html');
                    const newMain = newDoc.querySelector('main');

                    if (newMain && mainContent) {
                        document.title = newDoc.querySelector('title').textContent;
                        mainContent.innerHTML = newMain.innerHTML;
                        mainContent.className = newMain.className;
                        
                        if (url.endsWith('index.html') || url.endsWith('/')) {
                            setupStaticHomePage();
                        }
                        
                        initializePageScripts();
                        mainContent.classList.remove('is-leaving');
                    }
                } catch (error) {
                    console.error('Error loading page:', error);
                    if (mainContent) mainContent.classList.remove('is-leaving');
                }
                resolve();
            }, CONFIG.animation.pageTransition);
        });
    }

    navMenu.addEventListener('click', e => {
        const link = e.target.closest('a.nav-link');
        if (!link) return;
        e.preventDefault();
        
        const currentLink = document.querySelector('.nav-link.active');
        if (link === currentLink) return;

        const targetPath = link.getAttribute('href');
        history.pushState({}, '', targetPath);
        
        movePill(link);
        loadPage(targetPath);
    });

    window.addEventListener('popstate', () => {
        const targetPath = window.location.pathname.split('/').pop() || 'index.html';
        const targetLink = Array.from(navLinks).find(link => link.getAttribute('href') === targetPath);
        if (targetLink) {
            movePill(targetLink);
            loadPage(targetPath);
        }
    });

    function setInitialState() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const initialActiveLink = Array.from(navLinks).find(link => {
            const href = link.getAttribute('href');
            return href === currentPath || href === `/${currentPath}`;
        });
        
        if (initialActiveLink) {
            navPill.style.transition = 'none';
            document.fonts.ready.then(() => {
                movePill(initialActiveLink);
                setTimeout(() => {
                    navPill.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), width 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                }, CONFIG.animation.pillTransitionDelay);
            });
        }
    }

    function setupStaticHomePage() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const taglineElement = document.getElementById('tagline');
        const introButtons = document.getElementById('intro-buttons');

        if (line1Element) line1Element.textContent = CONFIG.text.introLine1;
        if (line2Element) {
            line2Element.innerHTML = CONFIG.text.introLine2 + '<span class="rotating-word">' + CONFIG.text.introRotatingWords[0] + '</span>';
            startWordRotation(line2Element.querySelector('.rotating-word'));
        }
        if (taglineElement) taglineElement.textContent = CONFIG.text.tagline;
        if (introButtons) introButtons.style.display = 'none';
        
        document.body.classList.add('intro-done');
    }

    function startWordRotation(el) {
        if (!el) return;
        const words = CONFIG.text.introRotatingWords;
        let idx = 0;
        setInterval(() => {
            el.classList.add('rotate-out');
            setTimeout(() => {
                idx = (idx + 1) % words.length;
                el.textContent = words[idx];
                el.classList.remove('rotate-out');
                el.classList.add('rotate-in');
                setTimeout(() => el.classList.remove('rotate-in'), 400);
            }, 300);
        }, 2500);
    }

    function runIntroSequence() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const taglineElement = document.getElementById('tagline');
        const introButtonsContainer = document.getElementById('intro-buttons');

        if (!line1Element || !line2Element || !introButtonsContainer || !taglineElement) return;
        
        taglineElement.style.display = 'none';

        function typeWriter(element, text, callback) {
            let i = 0;
            element.textContent = '';
            element.classList.add('typing-cursor');

            function type() {
                if (i < text.length) {
                    element.innerHTML = text.substring(0, i + 1);
                    i++;
                    setTimeout(type, CONFIG.animation.typingSpeed);
                } else {
                    element.classList.remove('typing-cursor');
                    if (callback) callback();
                }
            }
            type();
        }

        typeWriter(line1Element, CONFIG.text.introLine1, () => {
            typeWriter(line2Element, CONFIG.text.introLine2, () => {
                // After typing the prefix, add the rotating word
                const span = document.createElement('span');
                span.className = 'rotating-word';
                span.textContent = CONFIG.text.introRotatingWords[0];
                line2Element.appendChild(span);
                line2Element.classList.add('typing-cursor');
                
                setTimeout(() => {
                    introButtonsContainer.classList.add('visible');
                    addIntroButtonListeners();
                    startWordRotation(span);
                }, 600);
            });
        });
    }
    
    function addIntroButtonListeners() {
        const introButtons = document.querySelectorAll('.intro-btn');
        introButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.setItem('introSeen', 'true');
                
                const targetPath = button.getAttribute('href');
                
                document.querySelector('.typing-container').classList.add('fade-out');
                document.getElementById('intro-buttons').classList.add('fade-out');
                document.body.classList.add('intro-done');
                
                setTimeout(() => {
                    history.pushState({}, '', targetPath);
                    const targetLink = Array.from(document.querySelectorAll('.nav-link')).find(
                        link => link.getAttribute('href') === targetPath
                    );
                    if (targetLink) movePill(targetLink);
                    loadPage(targetPath);
                }, CONFIG.animation.introFadeOut); 
            });
        });
    }

    // Determine if we should run intro or static page
    const isHomePage = window.location.pathname.endsWith('index.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (!sessionStorage.getItem('introSeen') && isHomePage) {
        runIntroSequence();
    } else {
        setupStaticHomePage();
    }

    setInitialState();
    initializePageScripts();
}

// ============================================
// DOM READY HANDLER
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPage);
} else {
    setupPage();
}
