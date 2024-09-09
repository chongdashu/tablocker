document.addEventListener('DOMContentLoaded', function () {
  const actionButton = document.getElementById('actionButton');
  if (actionButton) {
    actionButton.addEventListener('click', function () {
      alert('Button clicked!');
    });
  }
});
