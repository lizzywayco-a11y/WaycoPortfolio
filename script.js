
const searchInput = document.getElementById('certificateSearch');
const categorySelect = document.getElementById('categorySelect');
const categoryPills = document.getElementById('categoryPills');
const cardsContainer = document.getElementById('certificateGrid');
const resultsText = document.getElementById('resultsText');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const modal = document.getElementById('previewModal');
const modalTitle = document.getElementById('modalTitle');
const previewArea = document.getElementById('previewArea');
const closeModalButton = document.getElementById('closeModal');
const uploadInput = document.getElementById('certificateUpload');

let uploadedObjectUrls = [];
let uploadedCount = 0;

// Search and filter certificates
function updateCertificates() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const cards = [
    ...cardsContainer.querySelectorAll('.certificate-card')
  ];

  let visibleCount = 0;
  let matchingCount = 0;

  cards.forEach(card => {
    const category = card.dataset.category;

    const searchableText = [
      card.dataset.title || '',
      card.dataset.keywords || '',
      card.innerText || ''
    ].join(' ').toLowerCase();

    const categoryMatches =
      selectedCategory === 'all' ||
      category === selectedCategory;

    const textMatches =
      !query || searchableText.includes(query);

    const matches = categoryMatches && textMatches;

    card.style.display = categoryMatches ? '' : 'none';

    card.classList.toggle(
      'search-match',
      Boolean(query) && matches
    );

    card.classList.toggle(
      'search-dim',
      Boolean(query) && categoryMatches && !textMatches
    );

    if (categoryMatches) visibleCount++;
    if (matches) matchingCount++;
  });

  const hasSearch = Boolean(query);
  const shown = hasSearch ? matchingCount : visibleCount;

  resultsText.textContent = hasSearch
    ? `Found ${matchingCount} matching certificate${matchingCount === 1 ? '' : 's'}${selectedCategory !== 'all' ? ' in ' + selectedCategory : ''}`
    : `Showing ${visibleCount} certificate${visibleCount === 1 ? '' : 's'}${selectedCategory !== 'all' ? ' in ' + selectedCategory : ''}`;

  emptyState.style.display = shown === 0 ? 'block' : 'none';
  totalCount.textContent = cards.length;
}

// Change selected category
function setCategory(category) {
  categorySelect.value = category;

  [
    ...categoryPills.querySelectorAll('.category-pill')
  ].forEach(pill => {
    pill.classList.toggle(
      'active',
      pill.dataset.category === category
    );
  });

  updateCertificates();
}

searchInput.addEventListener('input', updateCertificates);

categorySelect.addEventListener('change', () => {
  setCategory(categorySelect.value);
});

categoryPills.addEventListener('click', event => {
  const pill = event.target.closest('.category-pill');

  if (pill) {
    setCategory(pill.dataset.category);
  }
});

// Mobile navigation
menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');

  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.textContent = isOpen ? '✕' : '☰';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = '☰';
  });
});

// Highlight the section currently being viewed
const sections = [
  ...document.querySelectorAll('main section[id]')
];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.querySelectorAll('a').forEach(link => {
        link.classList.toggle(
          'active',
          link.getAttribute('href') === '#' + entry.target.id
        );
      });
    }
  });
}, {
  rootMargin: '-35% 0px -55% 0px'
});

sections.forEach(section => observer.observe(section));

// Open a certificate inside the modal
function openPreview(title, fileUrl, fileType) {
  modalTitle.textContent = title;
  previewArea.replaceChildren();

  if (fileUrl && fileType === 'application/pdf') {
    const iframe = document.createElement('iframe');

    iframe.src = fileUrl;
    iframe.title = title;
    iframe.style.width = '100%';
    iframe.style.height = '65vh';
    iframe.style.minHeight = '350px';
    iframe.style.border = 'none';

    previewArea.appendChild(iframe);

  } else if (fileUrl && fileType.startsWith('image/')) {
    const img = document.createElement('img');

    img.src = fileUrl;
    img.alt = title;
    img.style.display = 'block';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '65vh';
    img.style.margin = '0 auto';
    img.style.objectFit = 'contain';

    previewArea.appendChild(img);

  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'preview-placeholder';

    const heading = document.createElement('strong');
    heading.textContent = title;

    const message = document.createElement('p');
    message.textContent =
      'Certificate file not found. Please check the file path in your HTML.';

    placeholder.append(heading, message);
    previewArea.appendChild(placeholder);
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// Handle clicks on certificate preview buttons
cardsContainer.addEventListener('click', event => {
  const button = event.target.closest('[data-preview]');

  if (!button) return;

  const card = button.closest('.certificate-card');

  if (!card) return;

  const title =
    button.dataset.title ||
    card.dataset.title ||
    card.querySelector('h3')?.textContent ||
    'Certificate Preview';

  // Read the file path from the button first, then the card.
  const fileUrl =
  button.getAttribute('data-file') ||
  card.getAttribute('data-file-url') ||
  card.dataset.fileUrl ||
  '';

  // Determine whether the file is a PDF or an image.
  const cleanUrl = fileUrl.split('?')[0].toLowerCase();

  let fileType = '';

  if (cleanUrl.endsWith('.pdf')) {
    fileType = 'application/pdf';
  } else if (cleanUrl.endsWith('.png')) {
    fileType = 'image/png';
  } else if (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg')
  ) {
    fileType = 'image/jpeg';
  } else if (cleanUrl.endsWith('.webp')) {
    fileType = 'image/webp';
  } else if (card.dataset.fileType) {
    fileType = card.dataset.fileType;
  }

  openPreview(title, fileUrl, fileType);
});

// Close the modal
function closePreview() {
  modal.classList.remove('open');
  previewArea.replaceChildren();
  document.body.style.overflow = '';
}

closeModalButton.addEventListener('click', closePreview);

modal.addEventListener('click', event => {
  if (event.target === modal) {
    closePreview();
  }
});

document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    modal.classList.contains('open')
  ) {
    closePreview();
  }
});

// Upload certificates temporarily in the browser
uploadInput.addEventListener('change', event => {
  const files = [...event.target.files];

  files.forEach(file => {
    if (
      !file.type.startsWith('image/') &&
      file.type !== 'application/pdf'
    ) {
      return;
    }

    const url = URL.createObjectURL(file);

    uploadedObjectUrls.push(url);
    uploadedCount++;

    const category =
      categorySelect.value === 'all'
        ? 'International'
        : categorySelect.value;

    const card = document.createElement('article');
    card.className = 'certificate-card';
    card.dataset.category = category;

    card.dataset.title = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ');

    card.dataset.keywords =
      `${category} uploaded file ${file.type}`;

    card.dataset.fileUrl = url;
    card.dataset.fileType = file.type;

    const iconText =
      category === 'TESDA' ? 'T' :
      category === 'DICT' ? 'D' :
      category === 'FreeCodeCamp' ? 'f' :
      category === 'Cisco Network Academy' ? 'C' : '★';

    const top = document.createElement('div');
    top.className = 'certificate-top';

    const icon = document.createElement('div');
    icon.className = 'certificate-icon';
    icon.textContent = iconText;

    const badge = document.createElement('span');
    badge.className = 'certificate-category';
    badge.textContent = category;

    top.append(icon, badge);

    const title = document.createElement('h3');
    title.textContent = card.dataset.title;

    const description = document.createElement('p');
    description.textContent =
      'Uploaded certificate file. Click View Certificate to preview it.';

    const footer = document.createElement('div');
    footer.className = 'certificate-footer';

    const small = document.createElement('small');
    small.textContent = `Uploaded file ${uploadedCount}`;

    const view = document.createElement('button');
    view.className = 'view-btn';
    view.type = 'button';
    view.dataset.preview = '';
    view.textContent = 'View Certificate ↗';

    footer.append(small, view);

    card.append(top, title, description, footer);
    cardsContainer.prepend(card);
  });

  updateCertificates();
  uploadInput.value = '';
});

// Release temporary upload URLs when leaving the page
window.addEventListener('beforeunload', () => {
  uploadedObjectUrls.forEach(url => {
    URL.revokeObjectURL(url);
  });
});

// Current year in the footer
document.getElementById('year').textContent =
  new Date().getFullYear();

updateCertificates();
