"use strict";
// Shows the password saved through set-password.html on the leaflet page.
(() => {
    const PASSWORD_URL = 'data/password.json';
    const field = document.getElementById('password');
    if (!field)
        throw new Error('Missing element #password');
    async function load() {
        // The timestamp stops the browser from showing an outdated password.
        const response = await fetch(`${PASSWORD_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok)
            return '';
        const data = await response.json();
        return typeof data.password === 'string' ? data.password.trim() : '';
    }
    load()
        .catch(() => '')
        .then((password) => {
        field.textContent = password || 'Пароль ещё не готов. Загляни попозже!';
        field.classList.toggle('empty', !password);
    });
})();
