
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.getElementById('fetchButton');
const gallery = document.getElementById('gallery');
const galleryCount = document.getElementById('galleryCount');
const modal = document.getElementById('imageModal');
const modalMedia = document.getElementById('modalMedia');
const closeModalButton = document.getElementById('closeModal');
const notificationButton = document.getElementById('notificationButton');
const installButton = document.getElementById('installButton');

setupDateInputs(startInput, endInput);

const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Sunlight takes about 8 minutes and 20 seconds to reach Earth.",
  "Jupiter has the shortest day of any planet in our solar system.",
  "The footprints left on the Moon can last millions of years.",
  "Neptune takes about 165 Earth years to orbit the Sun.",
  "The Sun contains more than 99% of the solar system's mass.",
  "Saturn's average density is lower than that of water.",
  "One million Earths could fit inside the Sun by volume.",
  "Olympus Mons on Mars is the largest known volcano in our solar system."
];

document.getElementById('spaceFact').textContent =
  spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

let lastFocusedElement = null;
let deferredInstallPrompt = null;

function showMessage(message) {
  gallery.replaceChildren();

  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.textContent = message;

  gallery.appendChild(placeholder);
}

function getImageUrl(item) {
  return item.hdurl || null;
}

function createGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';

  const imageUrl = getImageUrl(item);

  if (item.media_type === 'image' && imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = item.alt || item.title;
    image.loading = 'lazy';
    card.appendChild(image);
  } else {
    const videoPlaceholder = document.createElement('div');
    videoPlaceholder.className = 'video-placeholder';
    videoPlaceholder.textContent = '▶ View NASA Content';
    card.appendChild(videoPlaceholder);
  }

  const details = document.createElement('div');
  details.className = 'card-details';

  const date = document.createElement('span');
  date.className = 'card-date';
  date.textContent = item.date;

  const title = document.createElement('h3');
  title.textContent = item.title;

  details.append(date, title);
  card.appendChild(details);

  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View ${item.title}`);

  card.addEventListener('click', () => openModal(item));
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(item);
    }
  });

  return card;
}

function displayGallery(items) {
  gallery.replaceChildren();

  if (!items.length) {
    showMessage('No NASA content found for these dates.');
    galleryCount.textContent = '';
    return;
  }

  items.sort((a, b) => b.date.localeCompare(a.date));

  items.forEach(item => {
    gallery.appendChild(createGalleryItem(item));
  });

  galleryCount.textContent = `${items.length} results`;
}

function formatDate(date) {
  return date.slice(2).replaceAll('-', '');
}

async function fetchSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate || startDate > endDate) {
    showMessage('Please choose a valid date range.');
    return;
  }

  fetchButton.disabled = true;
  fetchButton.textContent = 'Loading...';
  galleryCount.textContent = '';
  showMessage('🚀 Loading space photos...');

  const params = new URLSearchParams({
    date_from: formatDate(startDate),
    date_to: formatDate(endDate),
    per_page: '25'
  });

  try {
    const response = await fetch(
      `https://science.nasa.gov/wp-json/wp/v2/apod-basic?${params}`
    );

    if (!response.ok) {
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();
    const entries = Array.isArray(data) ? data : [data];

    displayGallery(entries);
  } catch (error) {
    console.error(error);

    showMessage(
      navigator.onLine
        ? 'Unable to load NASA photos. Please try again.'
        : 'You are offline. Try a previously loaded date range.'
    );
  } finally {
    fetchButton.disabled = false;
    fetchButton.textContent = 'Get Space Images';
  }
}

function openModal(item) {
  lastFocusedElement = document.activeElement;
  modalMedia.replaceChildren();

  const imageUrl = getImageUrl(item);

  if (item.media_type === 'image' && imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = item.alt || item.title;
    modalMedia.appendChild(image);
  } else {
    const link = document.createElement('a');
    link.href = item.permalink || item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View on NASA';
    link.className = 'video-link';
    modalMedia.appendChild(link);
  }

  document.getElementById('modalDate').textContent = item.date;
  document.getElementById('modalTitle').textContent = item.title;

  const explanation = item.explanation || 'No description available.';
  const cleanExplanation = document.createElement('div');
  cleanExplanation.innerHTML = explanation;

  document.getElementById('modalExplanation').textContent =
    cleanExplanation.textContent;

  modal.hidden = false;
  document.body.classList.add('modal-open');
  closeModalButton.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  modalMedia.replaceChildren();
  lastFocusedElement?.focus();
}

fetchButton.addEventListener('click', fetchSpaceImages);
closeModalButton.addEventListener('click', closeModal);

modal.addEventListener('click', event => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }

  if (event.key === 'Tab' && !modal.hidden) {
    event.preventDefault();
    closeModalButton.focus();
  }
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

notificationButton.addEventListener('click', async () => {
  if (!('Notification' in window)) {
    alert('Notifications are not supported in this browser.');
    return;
  }

  if (Notification.permission === 'denied') {
    alert('Notifications are blocked. Check your browser settings.');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    notificationButton.textContent = 'Notifications Enabled';

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification('NASA Space Explorer', {
          body: 'You are ready to explore the universe!',
          icon: 'icons/icon-192.png'
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .catch(error => console.error('Service worker error:', error));
  });
}

fetchSpaceImages();
