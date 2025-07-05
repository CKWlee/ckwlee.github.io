// --- Universal Page Script Initializers ---
function initializePageScripts() {
    initializePortfolioModal();
    initializeTimelineAnimation();
    initializePortfolioFilter();
    initializeResumeToggle();
    initializeInterestsPage();
}

function initializePortfolioModal() {
    const portfolioContent = document.querySelector('.portfolio-content');
    if (!portfolioContent) return;

    const modal = document.getElementById('portfolio-modal');
    if (!modal) return;

    const modalCloseBtn = modal.querySelector('.modal-close-btn');
    const modalPrevBtn = modal.querySelector('.modal-nav-prev');
    const modalNextBtn = modal.querySelector('.modal-nav-next');
    const modalVideoContainer = modal.querySelector('.modal-video-container');

    let projectTiles = [];
    let currentIndex = 0;

    function updateModalContent(index) {
        projectTiles = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile'));
        if (!projectTiles.length) return;
        const tile = projectTiles[index];
        if (!tile) return;

        modal.querySelector('#modal-title').textContent = tile.dataset.title;
        modal.querySelector('#modal-description').textContent = tile.dataset.description;

        const videoSrc = tile.dataset.videoSrc;

        if (videoSrc.endsWith('.mp4') || videoSrc.endsWith('.webm') || videoSrc.endsWith('.ogg')) {
            modalVideoContainer.innerHTML = `
                <video id="modal-video" controls autoplay muted loop>
                    <source src="${videoSrc}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`;
        } else {
            modalVideoContainer.innerHTML = `<img id="modal-video-placeholder" src="${videoSrc}" alt="Project media" style="width: 100%; height: auto; display: block; border-radius: 4px;">`;
        }

        const repoLinkElement = modal.querySelector('#modal-repo-link');
        const repoLink = tile.dataset.repoLink;

        if (repoLink) {
            repoLinkElement.href = repoLink;
            repoLinkElement.style.display = 'inline-block';
        } else {
            repoLinkElement.style.display = 'none';
        }

        currentIndex = index;
    }

    function openModal(clickedTile) {
        const index = Array.from(document.querySelectorAll('.portfolio-section:not(.hidden) .project-tile')).indexOf(clickedTile);
        if (index === -1) return;
        updateModalContent(index);
        document.body.classList.add('modal-open');
        modal.classList.add('active');
    }

    function closeModal() {
        document.body.classList.remove('modal-open');
        modal.classList.remove('active');
        const video = modal.querySelector('#modal-video');
        if (video) video.pause();
        modalVideoContainer.innerHTML = '';
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

function initializeTimelineAnimation() {
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    if (!timelineWrapper || timelineWrapper.dataset.animated) return;

    const timelineItems = timelineWrapper.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        const clone = item.cloneNode(true);
        timelineWrapper.appendChild(clone);
    });
    timelineWrapper.dataset.animated = 'true';

    timelineWrapper.addEventListener('mousedown', () => { timelineWrapper.style.animationPlayState = 'paused'; });
    timelineWrapper.addEventListener('mouseup', () => { timelineWrapper.style.animationPlayState = 'running'; });
    timelineWrapper.addEventListener('mouseleave', () => { timelineWrapper.style.animationPlayState = 'running'; });
    timelineWrapper.addEventListener('touchstart', () => { timelineWrapper.style.animationPlayState = 'paused'; });
    timelineWrapper.addEventListener('touchend', () => { timelineWrapper.style.animationPlayState = 'running'; });
}

function initializePortfolioFilter() {
    const nav = document.querySelector('.portfolio-nav');
    if (!nav) return;

    const navLinks = nav.querySelectorAll('.portfolio-nav-link');
    const portfolioSections = document.querySelectorAll('.portfolio-section');

    nav.addEventListener('click', (e) => {
        const link = e.target.closest('.portfolio-nav-link');
        if (!link) return;
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const targetId = link.dataset.target;
        portfolioSections.forEach(section => { section.classList.add('hidden'); });
        const targetSection = document.getElementById(`${targetId}-portfolio`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    });
}

function initializeResumeToggle() {
    const viewBtn = document.getElementById('view-resume-btn');
    const resumeSection = document.getElementById('resume-details-section');

    if (viewBtn && resumeSection) {
        viewBtn.addEventListener('click', () => {
            resumeSection.classList.remove('hidden');
            viewBtn.parentElement.classList.add('hidden');
        });
    }
}

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

// --- Core Page Navigation and Intro Logic ---

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
        const introButtons = document.getElementById('intro-buttons');

        if (line1Element) line1Element.textContent = "Hello, I'm Corwin Lee!";
        if (line2Element) {
            line2Element.textContent = "Welcome to my page!";
            line2Element.classList.add('typing-cursor');
        }
        if (introButtons) {
            introButtons.style.display = 'none';
        }
        document.body.classList.add('intro-done');
    }

    // --- RESTORED INTRO FUNCTIONS ---
    function runIntroSequence() {
        const line1Element = document.getElementById('typed-text-1');
        const line2Element = document.getElementById('typed-text-2');
        const introButtonsContainer = document.getElementById('intro-buttons');

        if (!line1Element || !line2Element || !introButtonsContainer) return;

        const line1Text = "Hello, I'm Corwin Lee!";
        const line2Text = "Welcome to my page!";
        const typingSpeed = 100;

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
    
    // --- Main Logic Flow ---
    if (!sessionStorage.getItem('introSeen') && (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/'))) {
        runIntroSequence();
    } else {
        setupStaticHomePage();
    }

    setInitialState();
    initializePageScripts();
}

// --- Run Everything ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPage);
} else {
    setupPage();
}