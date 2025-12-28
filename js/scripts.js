// Add hover effects to cards
document.querySelectorAll('.bento-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-4px)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
  });
});

// Add hover sound effect (optional)
document.querySelectorAll('.link-button').forEach(button => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.02)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
});

// Console Easter Egg
console.log('%c👋 Hey Developer!', 'font-size: 24px; font-weight: bold; color: #22c55e;');
console.log('%cWant to connect? Check out my links above!', 'font-size: 14px; color: #6b8f7a;');