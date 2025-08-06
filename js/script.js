// --- Universal Page Script Initializers ---
function initializePageScripts() {
    initializeConstellation();
    initializePortfolioModal();
    initializeTimelineAnimation(); 
    initializeResumeToggle();
    initializeInterestsPage();
    initializePortfolioFilter();
    initializeHamburgerMenu();
}

function initializeHamburgerMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
            document.body.classList.toggle('modal-open');
        });

        document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
            if (navMenu.classList.contains('active')) {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
                document.body.classList.remove('modal-open');
            }
        }));
    }
}

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
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = Math.random() * 0.4 - 0.2;
            this.vy = Math.random() * 0.4 - 0.2;
            this.radius = Math.random() * 1.5 + 0.5;
            this.color = 'rgba(139, 92, 246, 0.8)';
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

    const createParticles = () => {
        particles = [];
        const particleCount = Math.floor((canvas.width * canvas.height) / 15000);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    };
    createParticles();
    window.addEventListener('resize', createParticles);

    const connectParticles = () => {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${1 - distance / 120})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    };

    const animate = () => {
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
        if (e.clientY < 50) {
            navbar.classList.remove('hidden-up');
        } else {
            navbar.classList.add('hidden-up');
        }
    };

    function createListFromData(dataString) {
        try {
            const items = JSON.parse(dataString);
            if (!Array.isArray(items)) return '';
            return `<ul>${items.map(item => `<li>${item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`).join('')}</ul>`;
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
        
        modalUxDesign.innerHTML = tile.dataset.uxDesign ? `<h4>UI/UX Design</h4>${createListFromData(tile.dataset.uxDesign)}` : '';
        modalTechBreakdown.innerHTML = tile.dataset.techBreakdown ? `<h4>Technical Breakdown</h4>${createListFromData(tile.dataset.techBreakdown)}` : '';

        const videoSrc = tile.dataset.videoSrc;
        if (videoSrc && (videoSrc.includes('youtube.com/') || videoSrc.includes('youtu.be/'))) {
            modalMediaContainer.innerHTML = `<iframe src="${videoSrc}" class="youtube-embed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            modalMediaContainer.innerHTML = `<img src="https://placehold.co/1600x900/1a1a1a/ffffff?text=Video+Coming+Soon" alt="Project media" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        }

        modalRepoLink.href = tile.dataset.repoLink || '#';
        modalRepoLink.style.display = tile.dataset.repoLink ? 'inline-block' : 'none';
    }

    function openModal(clickedTile) {
        const index = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile')).indexOf(clickedTile);
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

    portfolioContent.addEventListener('click', e => {
        const tile = e.target.closest('.project-tile');
        if (tile) openModal(tile);
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

// Stubs for other initializers to prevent errors if they are not defined elsewhere
function initializeTimelineAnimation() {}
function initializeResumeToggle() {}
function initializeInterestsPage() {}
function initializePortfolioFilter() {}

// --- Core Page Navigation and Intro Logic --- (Assuming this part is correct from previous steps)
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
                    if(mainContent) mainContent.classList.remove('is-leaving');
                }
                resolve();
            }, 300);
        });
    }

    navMenu.addEventListener('click', e => {
        const link = e.target.closest('a.nav-link');
        if (!link) return;
        e.preventDefault();
        
        const currentLink = document.querySelector('.nav-link.active');
        if(link === currentLink) return;

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
        const initialActiveLink = Array.from(navLinks).find(link => link.getAttribute('href') === currentPath);
        
        if (initialActiveLink) {
            navPill.style.transition = 'none';
            document.fonts.ready.then(() => {
                movePill(initialActiveLink);
                setTimeout(() => {
                     navPill.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), width 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                }, 50);
            });
        }
    }

    function setupStaticHomePage() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const taglineElement = document.getElementById('tagline');
        const introButtons = document.getElementById('intro-buttons');

        if (line1Element) line1Element.textContent = "Hello, I'm Corwin Lee.";
        if (line2Element) line2Element.style.display = 'none';
        if (taglineElement) taglineElement.textContent = "Building Intuitive Experiences with Code & Data.";
        if (introButtons) introButtons.style.display = 'none';
        
        document.body.classList.add('intro-done');
    }

    function runIntroSequence() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const taglineElement = document.getElementById('tagline');
        const introButtonsContainer = document.getElementById('intro-buttons');

        if (!line1Element || !line2Element || !introButtonsContainer || !taglineElement) return;
        
        taglineElement.style.display = 'none';
        document.querySelector('.featured-projects-section').style.display = 'none';

        const line1Text = "Hello, I'm Corwin Lee.";
        const line2Text = "Welcome to my page.";
        const typingSpeed = 80;

        function typeWriter(element, text, callback) {
            let i = 0;
            element.textContent = '';
            element.classList.add('typing-cursor');

            function type() {
                if (i < text.length) {
                    element.innerHTML = text.substring(0, i + 1);
                    i++;
                    setTimeout(type, typingSpeed);
                } else {
                    element.classList.remove('typing-cursor');
                    if (callback) callback();
                }
            }
            type();
        }

        typeWriter(line1Element, line1Text, () => {
            typeWriter(line2Element, line2Text, () => {
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
                    const targetLink = Array.from(document.querySelectorAll('.nav-link')).find(link => link.getAttribute('href') === targetPath);
                    if (targetLink) movePill(targetLink);
                    loadPage(targetPath);
                }, 400); 
            });
        });
    }

    window.navigateToPortfolio = function(projectId) {
        sessionStorage.setItem('targetProject', projectId);
        const portfolioLink = document.querySelector('a[href="portfolio.html"]');
        if (portfolioLink) {
            portfolioLink.click();
        }
    }

    function checkAndOpenModal() {
        const targetProjectId = sessionStorage.getItem('targetProject');
        if (targetProjectId) {
            const targetTile = document.getElementById(targetProjectId);
            if (targetTile) {
                setTimeout(() => {
                    targetTile.click();
                    sessionStorage.removeItem('targetProject');
                }, 100);
            }
        }
    }
    
    if (!sessionStorage.getItem('introSeen') && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
        runIntroSequence();
    } else {
        setupStaticHomePage();
    }

    setInitialState();
    initializePageScripts();
    checkAndOpenModal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPage);
} else {
    setupPage();
}