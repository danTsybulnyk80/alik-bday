"use strict";
// Uploads the final photo by committing it to the GitHub repository.
// GitHub Pages serves the docs/ folder of the main branch and redeploys the site with the new photo in a minute or two.
(() => {
    const REPO = 'danTsybulnyk80/alik-bday';
    const BRANCH = 'main';
    const PHOTO_PATH = 'docs/photos/location.jpg';
    const TOKEN_KEY = 'alik-bday-github-token';
    // Longest side of the uploaded photo, in pixels.
    const MAX_SIZE = 1600;
    function byId(id) {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`Missing element #${id}`);
        return element;
    }
    const form = byId('upload-form');
    const tokenInput = byId('token');
    const fileInput = byId('photo');
    const preview = byId('preview');
    const button = byId('submit');
    const status = byId('status');
    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('Не получилось прочитать картинку. Попробуй другой файл.'));
            image.src = URL.createObjectURL(file);
        });
    }
    // Shrinks the photo and converts it to JPEG, returned as base64 without the data: prefix.
    async function toJpegBase64(file) {
        const image = await loadImage(file);
        const scale = Math.min(1, MAX_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Браузер не смог обработать картинку.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(image.src);
        return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    }
    async function github(token, method, body) {
        return fetch(`https://api.github.com/repos/${REPO}/contents/${PHOTO_PATH}${method === 'GET' ? `?ref=${BRANCH}` : ''}`, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async function upload(token, file) {
        const content = await toJpegBase64(file);
        // Replacing an existing file requires its current sha.
        const existing = await github(token, 'GET');
        if (existing.status === 401)
            throw new Error('GitHub не принял токен. Проверь, что он скопирован целиком и не истёк.');
        if (!existing.ok && existing.status !== 404)
            throw new Error(`GitHub ответил ошибкой ${existing.status}.`);
        const sha = existing.ok ? (await existing.json()).sha : undefined;
        const saved = await github(token, 'PUT', { message: 'Upload location photo', content, sha, branch: BRANCH });
        if (saved.status === 403 || saved.status === 404) {
            throw new Error('У токена нет права записи в репозиторий (нужно Contents: Read and write).');
        }
        if (!saved.ok)
            throw new Error(`GitHub ответил ошибкой ${saved.status}.`);
    }
    tokenInput.value = localStorage.getItem(TOKEN_KEY) ?? '';
    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        preview.hidden = !file;
        if (file)
            preview.src = URL.createObjectURL(file);
    });
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const token = tokenInput.value.trim();
        const file = fileInput.files?.[0];
        if (!token || !file)
            return;
        button.disabled = true;
        status.className = 'feedback';
        status.textContent = 'Загружаю...';
        try {
            await upload(token, file);
            localStorage.setItem(TOKEN_KEY, token);
            status.className = 'feedback success';
            status.textContent = 'Готово! Фото появится в конце опросника через 1-2 минуты.';
        }
        catch (error) {
            status.textContent = error instanceof Error ? error.message : 'Что-то пошло не так.';
        }
        finally {
            button.disabled = false;
        }
    });
})();
