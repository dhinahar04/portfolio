const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

function animateSkills() {
  const skillBars = document.querySelectorAll('.progress');
  const triggerPoint = window.innerHeight * 0.8;

  skillBars.forEach(bar => {
    const barTop = bar.getBoundingClientRect().top;
    if (barTop < triggerPoint) {
      bar.style.width = bar.getAttribute('style').replace('width: 0', '');
    }
  });
}

window.addEventListener('scroll', animateSkills);

const contactForm = document.getElementById('contact-form');
contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Thank you for reaching out! I will get back to you soon.');
  contactForm.reset();
});