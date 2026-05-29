// Simple family-use password — change before deploying
const PASSWORD = 'schroer2026';

// GitHub API config — fill these in before deploying
const GITHUB_TOKEN = const GITHUB_TOKEN = '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';
const GITHUB_OWNER = 'NFTvParty';
const GITHUB_REPO = 'fpadre-site';
const GITHUB_OWNER = '';
const GITHUB_REPO = '';

let contentData = null;
let fileSha = null;

// ---- AUTH ----

function checkAuth() {
  if (sessionStorage.getItem('admin_authed') !== 'yes') {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('editor-screen').style.display = 'none';
  } else {
    showEditor();
  }
}

document.getElementById('login-btn').addEventListener('click', () => {
  const val = document.getElementById('password-input').value;
  if (val === PASSWORD) {
    sessionStorage.setItem('admin_authed', 'yes');
    showEditor();
  } else {
    document.getElementById('login-error').textContent = 'Incorrect password.';
  }
});

document.getElementById('password-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('login-btn').click();
});

// ---- LOAD ----

async function showEditor() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('editor-screen').style.display = 'block';
  await loadContent();
}

async function loadContent() {
  try {
    const res = await fetch('../content.json?_=' + Date.now());
    contentData = await res.json();
    renderEditor();
  } catch (e) {
    alert('Could not load content.json: ' + e.message);
  }
}

// ---- RENDER EDITOR ----

function renderEditor() {
  const sel = document.getElementById('chapter-select');
  const currentVal = sel.value;
  sel.innerHTML = '<option value="all">All Chapters</option>';
  contentData.chapters.forEach((ch, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${ch.numeral}. ${ch.title}`;
    sel.appendChild(opt);
  });
  if (currentVal) sel.value = currentVal;

  renderSiteFields();
  renderBlocks();
}

function renderSiteFields() {
  const s = contentData.site;
  document.getElementById('site-intro').value = s.intro || '';
  document.getElementById('site-footer').value = s.footer || '';
}

function renderBlocks() {
  const chapterIdx = document.getElementById('chapter-select').value;
  const container = document.getElementById('blocks-container');
  container.innerHTML = '';

  const chapters = chapterIdx === 'all'
    ? contentData.chapters.map((ch, i) => ({ ch, i }))
    : [{ ch: contentData.chapters[+chapterIdx], i: +chapterIdx }];

  for (const { ch, i } of chapters) {
    if (chapterIdx === 'all') {
      const label = document.createElement('div');
      label.className = 'chapter-section-label';
      label.textContent = `${ch.numeral}. ${ch.title}`;
      container.appendChild(label);
    }

    ch.blocks.forEach((b, j) => {
      container.appendChild(buildBlockRow(b, i, j, ch.blocks.length));
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-block-btn';
    addBtn.textContent = '+ Add Block';
    addBtn.dataset.chapter = i;
    addBtn.addEventListener('click', () => openBlockPicker(+addBtn.dataset.chapter));
    container.appendChild(addBtn);
  }
}

function buildBlockRow(block, chIdx, bIdx, total) {
  const row = document.createElement('div');
  row.className = `block-row block-type-${block.type}`;

  const header = document.createElement('div');
  header.className = 'block-header';

  const pill = document.createElement('span');
  pill.className = `type-pill type-${block.type}`;
  pill.textContent = block.type;
  header.appendChild(pill);

  const controls = document.createElement('div');
  controls.className = 'block-controls';

  if (bIdx > 0) {
    const up = document.createElement('button');
    up.textContent = '↑';
    up.title = 'Move up';
    up.addEventListener('click', () => moveBlock(chIdx, bIdx, -1));
    controls.appendChild(up);
  }
  if (bIdx < total - 1) {
    const dn = document.createElement('button');
    dn.textContent = '↓';
    dn.title = 'Move down';
    dn.addEventListener('click', () => moveBlock(chIdx, bIdx, 1));
    controls.appendChild(dn);
  }
  const del = document.createElement('button');
  del.textContent = '✕';
  del.title = 'Delete';
  del.className = 'delete-btn';
  del.addEventListener('click', () => deleteBlock(chIdx, bIdx));
  controls.appendChild(del);

  header.appendChild(controls);
  row.appendChild(header);
  row.appendChild(buildBlockFields(block, chIdx, bIdx));
  return row;
}

function buildBlockFields(block, chIdx, bIdx) {
  const fields = document.createElement('div');
  fields.className = 'block-fields';

  const update = (key, value) => {
    contentData.chapters[chIdx].blocks[bIdx][key] = value;
  };

  if (block.type === 'text') {
    fields.appendChild(labeledTextarea('Quote', block.quote || '', v => update('quote', v)));
    fields.appendChild(labeledInput('Attribution', block.attribution || '', v => update('attribution', v)));
  }

  if (block.type === 'interstitial') {
    fields.appendChild(labeledTextarea('Quote', block.quote || '', v => update('quote', v)));
  }

  if (block.type === 'photo') {
    fields.appendChild(buildDropZone(block, chIdx, bIdx, 'photo'));
    fields.appendChild(labeledSelect('Aspect Ratio', ['4/3','3/4','1/1','16/9'], block.aspectRatio || '4/3', v => update('aspectRatio', v)));
    fields.appendChild(labeledInput('Date / Location', block.date || '', v => update('date', v)));
    fields.appendChild(labeledTextarea('Caption', block.caption || '', v => update('caption', v)));
  }

  if (block.type === 'video-square' || block.type === 'video-vertical') {
    fields.appendChild(buildDropZone(block, chIdx, bIdx, 'video'));
    fields.appendChild(labeledInput('Film Label', block.filmLabel || '', v => update('filmLabel', v)));
    fields.appendChild(labeledInput('Date / Location', block.date || '', v => update('date', v)));
    fields.appendChild(labeledTextarea('Caption', block.caption || '', v => update('caption', v)));
  }

  return fields;
}

function buildDropZone(block, chIdx, bIdx, mediaType) {
  const wrap = document.createElement('div');
  const ar = mediaType === 'video' && contentData.chapters[chIdx].blocks[bIdx].type === 'video-vertical' ? '9/16' : (block.aspectRatio || '4/3');
  wrap.className = 'drop-zone';
  wrap.style.aspectRatio = ar;

  if (block.src) {
    if (mediaType === 'photo') {
      wrap.innerHTML = `<img src="../${block.src}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
    } else {
      wrap.innerHTML = `<video src="../${block.src}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;" controls></video>`;
    }
  } else {
    wrap.innerHTML = `<span class="drop-hint">Drop ${mediaType} here or click to browse</span>`;
  }

  wrap.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = mediaType === 'photo' ? 'image/*' : 'video/*';
    input.onchange = e => handleFileSelect(e.target.files[0], chIdx, bIdx, mediaType, wrap);
    input.click();
  });

  wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drag-over'); });
  wrap.addEventListener('dragleave', () => wrap.classList.remove('drag-over'));
  wrap.addEventListener('drop', e => {
    e.preventDefault();
    wrap.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, chIdx, bIdx, mediaType, wrap);
  });

  return wrap;
}

function handleFileSelect(file, chIdx, bIdx, mediaType, wrap) {
  const folder = mediaType === 'photo' ? 'media/photos' : 'media/video';
  const path = `${folder}/${file.name}`;
  contentData.chapters[chIdx].blocks[bIdx].src = path;

  const url = URL.createObjectURL(file);
  if (mediaType === 'photo') {
    wrap.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">`;
  } else {
    wrap.innerHTML = `<video src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;" controls></video>`;
  }

  // store file for upload on save
  if (!window._pendingFiles) window._pendingFiles = [];
  window._pendingFiles.push({ file, path });
}

// ---- BLOCK PICKER ----

function openBlockPicker(chIdx) {
  const modal = document.getElementById('block-picker-modal');
  modal.style.display = 'flex';
  modal.dataset.chapter = chIdx;
}

document.getElementById('picker-close').addEventListener('click', () => {
  document.getElementById('block-picker-modal').style.display = 'none';
});

document.querySelectorAll('.picker-option').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const chIdx = +document.getElementById('block-picker-modal').dataset.chapter;
    addBlock(chIdx, type);
    document.getElementById('block-picker-modal').style.display = 'none';
  });
});

function addBlock(chIdx, type) {
  const defaults = {
    text:           { type: 'text', quote: '', attribution: '' },
    photo:          { type: 'photo', src: '', aspectRatio: '4/3', date: '', caption: '' },
    'video-square': { type: 'video-square', src: '', filmLabel: '', date: '', caption: '' },
    'video-vertical':{ type: 'video-vertical', src: '', filmLabel: '', date: '', caption: '' },
    interstitial:   { type: 'interstitial', quote: '' },
  };
  contentData.chapters[chIdx].blocks.push({ ...defaults[type] });
  renderBlocks();
}

// ---- REORDER / DELETE ----

function moveBlock(chIdx, bIdx, dir) {
  const blocks = contentData.chapters[chIdx].blocks;
  const newIdx = bIdx + dir;
  if (newIdx < 0 || newIdx >= blocks.length) return;
  [blocks[bIdx], blocks[newIdx]] = [blocks[newIdx], blocks[bIdx]];
  renderBlocks();
}

function deleteBlock(chIdx, bIdx) {
  if (!confirm('Delete this block?')) return;
  contentData.chapters[chIdx].blocks.splice(bIdx, 1);
  renderBlocks();
}

// ---- CHAPTER SELECTOR ----

document.getElementById('chapter-select').addEventListener('change', renderBlocks);

// ---- SITE FIELDS ----

document.getElementById('site-intro').addEventListener('input', e => {
  contentData.site.intro = e.target.value;
});
document.getElementById('site-footer').addEventListener('input', e => {
  contentData.site.footer = e.target.value;
});

// ---- SAVE ----

document.getElementById('save-btn').addEventListener('click', saveContent);

async function saveContent() {
  const btn = document.getElementById('save-btn');
  btn.textContent = 'Saving…';
  btn.disabled = true;

  try {
    if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
      await saveToGitHub();
    } else {
      downloadJSON();
    }
    btn.textContent = 'Saved ✓';
    setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 2000);
  } catch (e) {
    alert('Save failed: ' + e.message);
    btn.textContent = 'Save';
    btn.disabled = false;
  }
}

async function saveToGitHub() {
  const json = JSON.stringify(contentData, null, 2);
  const encoded = btoa(unescape(encodeURIComponent(json)));

  // get current sha if we don't have it
  if (!fileSha) {
    const metaRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content.json`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const meta = await metaRes.json();
    fileSha = meta.sha;
  }

  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content.json`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update content.json via admin',
      content: encoded,
      sha: fileSha,
    }),
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  fileSha = data.content.sha;
}

function downloadJSON() {
  const json = JSON.stringify(contentData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'content.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---- HELPERS ----

function labeledInput(label, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'field-wrap';
  wrap.innerHTML = `<label>${label}</label>`;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.addEventListener('input', e => onChange(e.target.value));
  wrap.appendChild(input);
  return wrap;
}

function labeledTextarea(label, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'field-wrap';
  wrap.innerHTML = `<label>${label}</label>`;
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.rows = 3;
  ta.addEventListener('input', e => onChange(e.target.value));
  wrap.appendChild(ta);
  return wrap;
}

function labeledSelect(label, options, value, onChange) {
  const wrap = document.createElement('div');
  wrap.className = 'field-wrap';
  wrap.innerHTML = `<label>${label}</label>`;
  const sel = document.createElement('select');
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    if (o === value) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => onChange(e.target.value));
  wrap.appendChild(sel);
  return wrap;
}

// ---- INIT ----
checkAuth();
