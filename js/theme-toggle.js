/**
 * theme-toggle.js
 * Theme toggle functionality with drag support and localStorage persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.querySelector('.theme-toggle');
  const html = document.documentElement;
  const icon = themeToggle.querySelector('i');

  // Drag state
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  let xOffset = 0;
  let yOffset = 0;

  // Restore saved theme and position on load
  const savedTheme = localStorage.getItem('theme');
  const savedPosition = localStorage.getItem('theme-toggle-position');

  if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);
  }

  if (savedPosition) {
    const { x, y } = JSON.parse(savedPosition);
    xOffset = x;
    yOffset = y;
    setTranslate(xOffset, yOffset, themeToggle);
  }

  // Click handler: toggle theme if not dragging
  themeToggle.addEventListener('click', (e) => {
    if (!isDragging) {
      toggleTheme();
    }
  });

  // Keyboard support: toggle theme with Enter or Space
  themeToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  });

  // Drag functionality: mouse and touch support
  themeToggle.addEventListener('mousedown', dragStart);
  themeToggle.addEventListener('touchstart', dragStart, false);
  document.addEventListener('mousemove', drag, false);
  document.addEventListener('touchmove', drag, false);
  document.addEventListener('mouseup', dragEnd, false);
  document.addEventListener('touchend', dragEnd, false);

  function dragStart(e) {
    if (e.type === 'touchstart') {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    isDragging = true;
    themeToggle.style.cursor = 'grabbing';
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();

    if (e.type === 'touchmove') {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, themeToggle);
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    themeToggle.style.cursor = 'move';

    // Save position
    localStorage.setItem('theme-toggle-position', JSON.stringify({
      x: xOffset,
      y: yOffset
    }));
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
  }

  function updateIcon(theme) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
});
