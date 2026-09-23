const supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const bookList = document.getElementById('book-list');
const emptyState = document.getElementById('empty-state');

const addBookBtn = document.getElementById('add-book-btn');
const bookModal = document.getElementById('book-modal');
const bookForm = document.getElementById('book-form');
const modalTitle = document.getElementById('modal-title');
const bookIdField = document.getElementById('book-id');
const bookTitleField = document.getElementById('book-title');
const bookAuthorField = document.getElementById('book-author');
const bookCategoryField = document.getElementById('book-category');
const categoryOptions = document.getElementById('category-options');
const cancelBtn = document.getElementById('cancel-btn');
const formError = document.getElementById('form-error');

let allBooks = [];

// ---- Auth ----

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginView.classList.remove('hidden');
  appView.classList.add('hidden');
}

function showApp() {
  loginView.classList.add('hidden');
  appView.classList.remove('hidden');
  loadBooks();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
    return;
  }
  loginForm.reset();
  showApp();
});

logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showLogin();
});

// ---- Data loading ----

async function loadBooks() {
  const { data, error } = await supabaseClient
    .from('books')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    bookList.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'error';
    message.textContent = `Failed to load books: ${error.message}`;
    bookList.appendChild(message);
    return;
  }

  allBooks = data;
  populateCategoryFilter(allBooks);
  render();
}

function populateCategoryFilter(books) {
  const categories = [...new Set(books.map((b) => b.category))].sort((a, b) =>
    a.localeCompare(b)
  );

  const currentValue = categoryFilter.value;
  categoryFilter.innerHTML = '<option value="">All categories</option>';
  categoryOptions.innerHTML = '';

  for (const category of categories) {
    const opt = document.createElement('option');
    opt.value = category;
    opt.textContent = category;
    categoryFilter.appendChild(opt);

    const dataOpt = document.createElement('option');
    dataOpt.value = category;
    categoryOptions.appendChild(dataOpt);
  }

  categoryFilter.value = currentValue;
}

// ---- Rendering ----

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const filtered = allBooks.filter((book) => {
    const matchesCategory = !category || book.category === category;
    const matchesQuery =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  bookList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const groups = new Map();
  for (const book of filtered) {
    if (!groups.has(book.category)) groups.set(book.category, []);
    groups.get(book.category).push(book);
  }

  const sortedCategories = [...groups.keys()].sort((a, b) => a.localeCompare(b));

  for (const category of sortedCategories) {
    const books = groups.get(category).sort((a, b) => a.title.localeCompare(b.title));

    const section = document.createElement('div');
    section.className = 'category-group';

    const heading = document.createElement('h2');
    heading.textContent = category;
    section.appendChild(heading);

    for (const book of books) {
      section.appendChild(renderBookRow(book));
    }

    bookList.appendChild(section);
  }
}

function renderBookRow(book) {
  const row = document.createElement('div');
  row.className = 'book-row';

  const info = document.createElement('div');
  info.className = 'book-info';

  const titleEl = document.createElement('div');
  titleEl.className = 'title';
  titleEl.textContent = book.title;

  const authorEl = document.createElement('div');
  authorEl.className = 'author';
  authorEl.textContent = book.author;

  info.append(titleEl, authorEl);

  const actions = document.createElement('div');
  actions.className = 'book-actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => openModal(book));

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => deleteBook(book));

  actions.append(editBtn, deleteBtn);
  row.append(info, actions);
  return row;
}

searchInput.addEventListener('input', render);
categoryFilter.addEventListener('change', render);

// ---- Add / Edit modal ----

function openModal(book) {
  formError.classList.add('hidden');
  bookForm.reset();

  if (book) {
    modalTitle.textContent = 'Edit book';
    bookIdField.value = book.id;
    bookTitleField.value = book.title;
    bookAuthorField.value = book.author;
    bookCategoryField.value = book.category;
  } else {
    modalTitle.textContent = 'Add book';
    bookIdField.value = '';
  }

  bookModal.classList.remove('hidden');
  bookTitleField.focus();
}

function closeModal() {
  bookModal.classList.add('hidden');
}

addBookBtn.addEventListener('click', () => openModal(null));
cancelBtn.addEventListener('click', closeModal);

bookForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');

  const payload = {
    title: bookTitleField.value.trim(),
    author: bookAuthorField.value.trim(),
    category: bookCategoryField.value.trim(),
  };

  const id = bookIdField.value;
  const { error } = id
    ? await supabaseClient.from('books').update(payload).eq('id', id)
    : await supabaseClient.from('books').insert(payload);

  if (error) {
    formError.textContent = error.message;
    formError.classList.remove('hidden');
    return;
  }

  closeModal();
  loadBooks();
});

async function deleteBook(book) {
  if (!confirm(`Delete "${book.title}"?`)) return;
  const { error } = await supabaseClient.from('books').delete().eq('id', book.id);
  if (error) {
    alert(`Failed to delete: ${error.message}`);
    return;
  }
  loadBooks();
}

// ---- Init ----

checkSession();
