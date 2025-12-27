/**
 * Portfolio Website - Main Script
 * Corwin Lee's personal portfolio site
 * 
 * Organized into:
 * 1. Configuration Constants
 * 2. Feature Modules (Constellation, Navigation, etc.)
 * 3. Page Initializers
 * 4. Main Setup
 */

// ============================================
// CONFIGURATION CONSTANTS
// ============================================
const CONFIG = {
    // Constellation Animation
    constellation: {
        particleDensity: 15000,      // Lower = more particles (pixels per particle)
        particleDensityMobile: 30000,
        connectionDistance: 120,      // Max distance to draw lines between particles
        particleSpeedRange: 0.4,      // Max velocity (-0.2 to 0.2)
        particleMinRadius: 0.5,
        particleMaxRadius: 2.0,
        particleColor: 'rgba(139, 92, 246, 0.8)',
        lineWidth: 0.5,
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
        introLine1: "Hello, I'm Corwin Lee.",
        introLine2: "Welcome to my page.",
        tagline: "Building Intuitive Experiences with Code & Data.",
    },
};

// ============================================
// CONSTELLATION BACKGROUND
// ============================================
function initializeConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            const { particleSpeedRange, particleMinRadius, particleMaxRadius, particleColor } = CONFIG.constellation;
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = Math.random() * particleSpeedRange - (particleSpeedRange / 2);
            this.vy = Math.random() * particleSpeedRange - (particleSpeedRange / 2);
            this.radius = Math.random() * (particleMaxRadius - particleMinRadius) + particleMinRadius;
            this.color = particleColor;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
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
    window.addEventListener('resize', createParticles);

    const connectParticles = () => {
        const { connectionDistance, lineWidth } = CONFIG.constellation;
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${1 - distance / connectionDistance})`;
                    ctx.lineWidth = lineWidth;
                    ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
        if (document.hidden) {
            requestAnimationFrame(animate);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        connectParticles();
        requestAnimationFrame(animate);
    };
    
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
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile'));
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
        const tiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile'));
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
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile'));
        if (!projectTiles.length) return;
        updateModalContent((currentIndex + 1) % projectTiles.length);
    }

    function showPrevProject() {
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile'));
        if (!projectTiles.length) return;
        updateModalContent((currentIndex - 1 + projectTiles.length) % projectTiles.length);
    }

    // Event Listeners
    portfolioContent.addEventListener('click', e => {
        const tile = e.target.closest('.project-tile');
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
// TIMELINE ANIMATION
// ============================================
function initializeTimelineAnimation() {
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper || timelineWrapper.dataset.animated) return;

    const timelineItems = timelineWrapper.querySelectorAll('.timeline-item');
    
    // Clone items for infinite scroll effect
    timelineItems.forEach(item => {
        const clone = item.cloneNode(true);
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
// RESUME TOGGLE
// ============================================
function initializeResumeToggle() {
    const viewBtn = document.getElementById('view-resume-btn');
    const resumeSection = document.getElementById('resume-details-section');

    if (viewBtn && resumeSection) {
        viewBtn.addEventListener('click', () => {
            resumeSection.classList.remove('hidden');
            viewBtn.parentElement.classList.add('hidden');
            resumeSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
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
// PAGE INITIALIZERS
// ============================================
function initializePageScripts() {
    initializeConstellation();
    initializePortfolioModal();
    initializeTimelineAnimation(); 
    initializeResumeToggle();
    initializeInterestsPage();
    initializePortfolioFilter();
    initializeHamburgerMenu();
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
        if (line2Element) line2Element.style.display = 'none';
        if (taglineElement) taglineElement.textContent = CONFIG.text.tagline;
        if (introButtons) introButtons.style.display = 'none';
        
        document.body.classList.add('intro-done');
    }

    function runIntroSequence() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const taglineElement = document.getElementById('tagline');
        const introButtonsContainer = document.getElementById('intro-buttons');
        const featuredSection = document.querySelector('.featured-projects-section');

        if (!line1Element || !line2Element || !introButtonsContainer || !taglineElement) return;
        
        taglineElement.style.display = 'none';
        if (featuredSection) featuredSection.style.display = 'none';

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
                line2Element.classList.add('typing-cursor');
                introButtonsContainer.classList.add('visible');
                addIntroButtonListeners();
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

    // Global navigation helper for featured projects
    window.navigateToPortfolio = function(projectId) {
        sessionStorage.setItem('targetProject', projectId);
        const portfolioLink = document.querySelector('a[href="/portfolio.html"], a[href="portfolio.html"]');
        if (portfolioLink) {
            portfolioLink.click();
        }
    };

    function checkAndOpenModal() {
        const targetProjectId = sessionStorage.getItem('targetProject');
        if (targetProjectId) {
            const targetTile = document.getElementById(targetProjectId);
            if (targetTile) {
                setTimeout(() => {
                    targetTile.click();
                    sessionStorage.removeItem('targetProject');
                }, CONFIG.animation.modalOpenDelay);
            }
        }
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
    checkAndOpenModal();
}

// ============================================
// DOM READY HANDLER
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPage);
} else {
    setupPage();
}
