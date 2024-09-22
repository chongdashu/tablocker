// Face animation
const face = document.querySelector('.face') as SVGSVGElement;
const eyes = face.querySelectorAll('circle:not(:first-child)');
const mouth = face.querySelector('path') as SVGPathElement;

function animateFace() {
  eyes.forEach(eye => {
    eye.setAttribute('cy', Math.random() > 0.5 ? '65' : '70');
  });
  mouth.setAttribute(
    'd',
    Math.random() > 0.5 ? 'M65 95 Q 100 125 135 95' : 'M65 90 Q 100 120 135 90'
  );
}

setInterval(animateFace, 2000);

// Button functionality
const button = document.querySelector('.button') as HTMLButtonElement;
button.addEventListener('click', () => {
  window.close();
});
