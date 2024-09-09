// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get('message');

// Set the toast message
const toastElement = document.getElementById('toast');
if (toastElement) {
  toastElement.textContent = message || 'Notification';
}

// Close the window after 3 seconds
setTimeout(() => window.close(), 3000);
