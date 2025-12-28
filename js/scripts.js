/* Bento Card Hover Effects */
document.querySelectorAll('.bento-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-4px)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
  });
});

/* Link Button Hover Effects */
document.querySelectorAll('.link-button').forEach(button => {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.02)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
});