// Vinyl records tab. Self-contained (IIFE) so its names never collide with
// app.js globals. `supabaseClient` is defined in app.js and used lazily.
(function () {
  const searchInput = document.getElementById('vinyl-search');
  const genreFilter = document.getElementById('vinyl-genre-filter');
  const grid = document.getElementById('vinyl-grid');
  const emptyState = document.getElementById('vinyl-empty');
  const addBtn = document.getElementById('add-vinyl-btn');

  const modal = document.getElementById('vinyl-modal');
  const form = document.getElementById('vinyl-form');
  const modalTitle = document.getElementById('vinyl-modal-title');
  const idField = document.getElementById('vinyl-id');
  const titleField = document.getElementById('vinyl-title');
  const artistField = document.getElementById('vinyl-artist');
  const yearField = document.getElementById('vinyl-year');
  const genreField = document.getElementById('vinyl-genre');
  const genreOptions = document.getElementById('vinyl-genre-options');
  const cancelBtn = document.getElementById('vinyl-cancel-btn');
  const formError = document.getElementById('vinyl-form-error');

  let allRecords = [];

  // ---- Tabs ----

  const tabs = document.querySelectorAll('.tab');
  const panels = {
    books: document.getElementById('books-panel'),
    vinyl: document.getElementById('vinyl-panel'),
  };

  function selectTab(name) {
    for (const tab of tabs) {
      const active = tab.dataset.tab === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    }
    for (const [key, panel] of Object.entries(panels)) {
      panel.classList.toggle('hidden', key !== name);
    }
    try { localStorage.setItem('activeTab', name); } catch (_) { /* storage unavailable */ }
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  }

  try {
    const saved = localStorage.getItem('activeTab');
    if (saved === 'vinyl') selectTab('vinyl');
  } catch (_) { /* storage unavailable */ }

  // ---- Data ----

  async function loadVinyl() {
    const { data, error } = await supabaseClient
      .from('vinyl_records')
      .select('*')
      .order('artist', { ascending: true });

    if (error) {
      grid.innerHTML = '';
      const message = document.createElement('p');
      message.className = 'error';
      message.textContent = /vinyl_records/.test(error.message)
        ? 'The vinyl table does not exist yet. Run schema-vinyl.sql in the Supabase SQL editor.'
        : `Failed to load records: ${error.message}`;
      grid.appendChild(message);
      return;
    }

    allRecords = data;
    populateGenres();
    render();
  }

  function populateGenres() {
    const genres = [...new Set(allRecords.map((r) => r.genre).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );
    const current = genreFilter.value;
    genreFilter.innerHTML = '<option value="">All genres</option>';
    genreOptions.innerHTML = '';
    for (const genre of genres) {
      const opt = document.createElement('option');
      opt.value = genre;
      opt.textContent = genre;
      genreFilter.appendChild(opt);

      const dataOpt = document.createElement('option');
      dataOpt.value = genre;
      genreOptions.appendChild(dataOpt);
    }
    genreFilter.value = current;
  }

  // ---- Rendering ----

  // Stable hue per record so each sleeve keeps its colour between renders.
  function hueFor(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const genre = genreFilter.value;

    const filtered = allRecords
      .filter((r) => {
        const matchesGenre = !genre || r.genre === genre;
        const matchesQuery =
          !query ||
          r.title.toLowerCase().includes(query) ||
          r.artist.toLowerCase().includes(query);
        return matchesGenre && matchesQuery;
      })
      .sort(
        (a, b) =>
          a.artist.localeCompare(b.artist) ||
          (a.year || 9999) - (b.year || 9999) ||
          a.title.localeCompare(b.title)
      );

    grid.innerHTML = '';
    emptyState.classList.toggle('hidden', filtered.length > 0);
    for (const record of filtered) grid.appendChild(renderCard(record));
  }

  function renderCard(record) {
    const hue = hueFor(`${record.artist}|${record.title}`);

    const card = document.createElement('article');
    card.className = 'vinyl-card';
    card.style.setProperty('--hue', hue);

    const cover = document.createElement('div');
    cover.className = 'vinyl-cover';

    const disc = document.createElement('div');
    disc.className = 'vinyl-disc';

    const sleeve = document.createElement('div');
    sleeve.className = 'vinyl-sleeve';
    const initial = document.createElement('span');
    initial.textContent = (record.title.trim()[0] || '♪').toUpperCase();
    sleeve.appendChild(initial);

    cover.append(disc, sleeve);

    const title = document.createElement('div');
    title.className = 'vinyl-title';
    title.textContent = record.title;

    const artist = document.createElement('div');
    artist.className = 'vinyl-artist';
    artist.textContent = record.artist;

    const meta = document.createElement('div');
    meta.className = 'vinyl-meta';
    meta.textContent = [record.year, record.genre].filter(Boolean).join(' · ');

    const actions = document.createElement('div');
    actions.className = 'book-actions vinyl-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openModal(record));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteRecord(record));

    actions.append(editBtn, deleteBtn);
    card.append(cover, title, artist, meta, actions);
    return card;
  }

  searchInput.addEventListener('input', render);
  genreFilter.addEventListener('change', render);

  // ---- Add / Edit modal ----

  function openModal(record) {
    formError.classList.add('hidden');
    form.reset();

    if (record) {
      modalTitle.textContent = 'Edit record';
      idField.value = record.id;
      titleField.value = record.title;
      artistField.value = record.artist;
      yearField.value = record.year ?? '';
      genreField.value = record.genre ?? '';
    } else {
      modalTitle.textContent = 'Add record';
      idField.value = '';
    }

    modal.classList.remove('hidden');
    titleField.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  addBtn.addEventListener('click', () => openModal(null));
  cancelBtn.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const payload = {
      title: titleField.value.trim(),
      artist: artistField.value.trim(),
      year: yearField.value ? parseInt(yearField.value, 10) : null,
      genre: genreField.value.trim() || null,
    };

    const id = idField.value;
    const { error } = id
      ? await supabaseClient.from('vinyl_records').update(payload).eq('id', id)
      : await supabaseClient.from('vinyl_records').insert(payload);

    if (error) {
      formError.textContent = error.message;
      formError.classList.remove('hidden');
      return;
    }

    closeModal();
    loadVinyl();
  });

  async function deleteRecord(record) {
    if (!confirm(`Delete "${record.title}"?`)) return;
    const { error } = await supabaseClient.from('vinyl_records').delete().eq('id', record.id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    loadVinyl();
  }

  window.loadVinyl = loadVinyl;
})();
