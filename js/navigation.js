/**
 * navigation.js
 * Handle navbar navigation: smooth scrolling, active link highlighting, mobile menu toggle
 */

document.addEventListener('DOMContentLoaded', () => {
  const navToggler = document.querySelector('.navbar-toggler');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');

  // Mobile menu toggle (improved): toggle the nav menu and aria-expanded
  if (navToggler) {
    const navMenu = navbar.querySelector('.navbar-nav');
    navToggler.setAttribute('aria-expanded', 'false');
    navToggler.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('active');
      navToggler.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // add a slight focus ring for keyboard users when opened
      if (isOpen) navMenu.querySelector('.nav-link')?.focus();
    });
  }

  // Close mobile menu when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Get the target section
      const targetId = link.getAttribute('href');
      if (targetId?.startsWith('#')) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          e.preventDefault();
          
          // Close mobile menu
          const navMenu = navbar.querySelector('.navbar-nav');
          if (navMenu?.classList.contains('active')) {
            navMenu.classList.remove('active');
          }
          
          // Smooth scroll to section
          setTimeout(() => {
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            updateActiveLink();
          }, 100);
        }
      }
    });
  });

  // Update active link based on scroll position (Intersection Observer)
  const observerOptions = {
    root: null,
    rootMargin: '-50px 0px -50%',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        updateActiveLink(entry.target.id);
      }
    });
  }, observerOptions);

  // Observe all sections
  const sections = document.querySelectorAll('section[id]');
  sections.forEach(section => observer.observe(section));

  function updateActiveLink(currentSectionId = null) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      if (currentSectionId) {
        const href = link.getAttribute('href');
        if (href === `#${currentSectionId}`) {
          link.classList.add('active');
        }
      }
    });
  }

  // Keyboard accessibility: Escape to close mobile menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const navMenu = navbar.querySelector('.navbar-nav');
      if (navMenu?.classList.contains('active')) {
        navMenu.classList.remove('active');
      }
    }
  });
});
