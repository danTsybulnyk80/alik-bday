// Saves the password for password.html by committing it to the GitHub repository.
// GitHub Pages serves the docs/ folder of the main branch and redeploys the site with the new password in a minute or two.
(() => {
  const REPO = 'danTsybulnyk80/alik-bday';
  const BRANCH = 'main';
  const PASSWORD_PATH = 'docs/data/password.json';
  // Shared with upload.html, so the token only has to be entered once.
  const TOKEN_KEY = 'alik-bday-github-token';

  function byId<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element #${id}`);
    return element as T;
  }

  const form = byId<HTMLFormElement>('password-form');
  const tokenInput = byId<HTMLInputElement>('token');
  const passwordInput = byId<HTMLInputElement>('password');
  const button = byId<HTMLButtonElement>('submit');
  const status = byId<HTMLElement>('status');

  // btoa only accepts Latin-1, so the text goes through UTF-8 bytes first.
  function toBase64(text: string): string {
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  async function github(token: string, method: string, body?: unknown): Promise<Response> {
    return fetch(`https://api.github.com/repos/${REPO}/contents/${PASSWORD_PATH}${method === 'GET' ? `?ref=${BRANCH}` : ''}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function save(token: string, password: string): Promise<void> {
    // Replacing an existing file requires its current sha.
    const existing = await github(token, 'GET');
    if (existing.status === 401) throw new Error('GitHub не принял токен. Проверь, что он скопирован целиком и не истёк.');
    if (!existing.ok && existing.status !== 404) throw new Error(`GitHub ответил ошибкой ${existing.status}.`);
    const sha = existing.ok ? (await existing.json()).sha : undefined;

    const content = toBase64(`${JSON.stringify({ password }, null, 2)}\n`);
    const saved = await github(token, 'PUT', { message: 'Update password', content, sha, branch: BRANCH });
    if (saved.status === 403 || saved.status === 404) {
      throw new Error('У токена нет права записи в репозиторий (нужно Contents: Read and write).');
    }
    if (!saved.ok) throw new Error(`GitHub ответил ошибкой ${saved.status}.`);
  }

  tokenInput.value = localStorage.getItem(TOKEN_KEY) ?? '';

  // Prefill with the password that is live on the site right now.
  fetch(`data/password.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : {}))
    .then((data: { password?: unknown }) => {
      if (typeof data.password === 'string' && !passwordInput.value) passwordInput.value = data.password;
    })
    .catch(() => {});

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = tokenInput.value.trim();
    const password = passwordInput.value.trim();
    if (!token || !password) return;

    button.disabled = true;
    status.className = 'feedback';
    status.textContent = 'Сохраняю...';
    try {
      await save(token, password);
      localStorage.setItem(TOKEN_KEY, token);
      status.className = 'feedback success';
      status.textContent = 'Готово! Пароль появится на листовке через 1-2 минуты.';
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : 'Что-то пошло не так.';
    } finally {
      button.disabled = false;
    }
  });
})();
