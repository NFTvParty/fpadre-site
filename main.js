const PLAY_SVG = `<svg width="13" height="15" viewBox="0 0 13 15" fill="none" style="margin-left:3px"><path d="M1 1L12 7.5L1 14V1Z" fill="rgba(200,160,60,0.6)"/></svg>`;
const PLAY_SVG_LG = `<svg width="15" height="17" viewBox="0 0 13 15" fill="none" style="margin-left:3px"><path d="M1 1L12 7.5L1 14V1Z" fill="rgba(200,160,60,0.6)"/></svg>`;

function buildTextBlock(b) {
  const el = document.createElement('div');
  el.className = 'card card-text';
  el.innerHTML = `
    <p class="quote">${b.quote}</p>
    ${b.attribution ? `<p class="attribution">${b.attribution}</p>` : ''}
  `;
  return el;
}

function buildPhotoBlock(b) {
  const el = document.createElement('div');
  el.className = 'card card-photo';
  el.innerHTML = `
    <div class="media-wrap">
      <img src="${b.src}" alt="Photograph" style="aspect-ratio:${b.aspectRatio || '4/3'};">
    </div>
    <div class="media-caption">
      ${b.date ? `<span class="date-tag">${b.date}</span>` : ''}
      ${b.caption ? `<p>${b.caption}</p>` : ''}
    </div>
  `;
  return el;
}

function buildVideoSquareBlock(b) {
  const el = document.createElement('div');
  el.className = 'card card-video';
  el.innerHTML = `
    <div class="video-area">
      ${b.src ? `<video src="${b.src}" preload="none" playsinline></video>` : ''}
      <div class="video-overlay">
        <div class="play-ring">${PLAY_SVG}</div>
        ${b.filmLabel ? `<span class="film-label">${b.filmLabel}</span>` : ''}
      </div>
    </div>
    <div class="media-caption">
      ${b.date ? `<span class="date-tag">${b.date}</span>` : ''}
      ${b.caption ? `<p>${b.caption}</p>` : ''}
    </div>
  `;
  if (b.src) attachPlayToggle(el.querySelector('.video-overlay'), el.querySelector('video'));
  return el;
}

function buildVideoVerticalBlock(b) {
  const el = document.createElement('div');
  el.className = 'card-vertical';
  el.innerHTML = `
    <div class="vertical-video-wrap">
      ${b.src ? `<video src="${b.src}" preload="none" playsinline></video>` : ''}
      <div class="video-overlay">
        <div class="play-ring">${PLAY_SVG_LG}</div>
        ${b.filmLabel ? `<span class="film-label">${b.filmLabel}</span>` : ''}
      </div>
    </div>
    <div class="media-caption">
      ${b.date ? `<span class="date-tag">${b.date}</span>` : ''}
      ${b.caption ? `<p>${b.caption}</p>` : ''}
    </div>
  `;
  if (b.src) attachPlayToggle(el.querySelector('.video-overlay'), el.querySelector('video'));
  return el;
}

function buildInterstitialBlock(b) {
  const el = document.createElement('div');
  el.className = 'interstitial';
  el.innerHTML = `<p>${b.quote}</p>`;
  return el;
}

function attachPlayToggle(overlay, video) {
  overlay.addEventListener('click', () => {
    overlay.classList.add('hidden');
    video.controls = true;
    video.play();
  });
}

function buildChapterMarker(ch) {
  const el = document.createElement('div');
  el.className = 'chapter-marker';
  el.innerHTML = `
    <div class="ch-line"></div>
    <span class="ch-num">${ch.numeral}</span>
    <span class="ch-label">${ch.title}</span>
    <div class="ch-line"></div>
  `;
  return el;
}

function renderBlock(b) {
  switch (b.type) {
    case 'text':           return buildTextBlock(b);
    case 'photo':          return buildPhotoBlock(b);
    case 'video-square':   return buildVideoSquareBlock(b);
    case 'video-vertical': return buildVideoVerticalBlock(b);
    case 'interstitial':   return buildInterstitialBlock(b);
    default: return null;
  }
}

async function init() {
  const res = await fetch('content.json');
  const data = await res.json();

  document.title = `${data.site.title} ${data.site.name}`;
  document.querySelector('header .eyebrow').textContent = 'A life in pictures';
  document.querySelector('header h1').innerHTML = `${data.site.title}<br><em>${data.site.name}</em>`;
  document.querySelector('header .dates').textContent = data.site.dates;
  document.querySelector('header .intro').textContent = data.site.intro;
  document.querySelector('footer p').textContent = data.site.footer;

  const main = document.getElementById('main-content');

  for (const ch of data.chapters) {
    main.appendChild(buildChapterMarker(ch));

    if (ch.blocks && ch.blocks.length > 0) {
      const feed = document.createElement('div');
      feed.className = 'feed-wrap';

      for (const b of ch.blocks) {
        const el = renderBlock(b);
        if (el) {
          if (b.type === 'interstitial') {
            feed.appendChild(el);
          } else {
            feed.appendChild(el);
          }
        }
      }

      main.appendChild(feed);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.06 });

  document.querySelectorAll('.card, .card-vertical, .chapter-marker, .interstitial').forEach(el => observer.observe(el));
}

init();
