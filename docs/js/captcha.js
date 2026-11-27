"use strict";
// Joke "captcha" shown before the quiz: a rating question, then a slider that flies the picture to the moon.
(() => {
    const RATING_OPTIONS = ['0-5000', '5000-10000', '10000-15000', 'Если захочу, будет 15'];
    const CORRECT_RATING = 3;
    const PASSED_KEY = 'alik-bday-captcha';
    function byId(id) {
        const element = document.getElementById(id);
        if (!element)
            throw new Error(`Missing element #${id}`);
        return element;
    }
    const card = byId('card');
    const ratingStep = byId('rating-step');
    const options = byId('rating-options');
    const ratingFeedback = byId('rating-feedback');
    const moonStep = byId('moon-step');
    const sky = byId('sky');
    const slider = byId('slider');
    const moonFeedback = byId('moon-feedback');
    function shake() {
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
    }
    RATING_OPTIONS.forEach((label, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'option';
        button.textContent = `${'абвг'[index]}. ${label}`;
        button.addEventListener('click', () => {
            if (index !== CORRECT_RATING) {
                ratingFeedback.textContent = 'Проверка не пройдена. Попробуй ещё раз.';
                shake();
                return;
            }
            ratingStep.hidden = true;
            moonStep.hidden = false;
        });
        options.append(button);
    });
    const max = Number(slider.max);
    slider.addEventListener('input', () => {
        sky.style.setProperty('--progress', String(Number(slider.value) / max));
        moonFeedback.textContent = '';
    });
    // Fires when the slider is released.
    slider.addEventListener('change', () => {
        if (Number(slider.value) < max) {
            slider.value = '0';
            sky.style.setProperty('--progress', '0');
            moonFeedback.className = 'feedback';
            moonFeedback.textContent = 'До Луны не долетел. Тяни до конца!';
            return;
        }
        slider.disabled = true;
        sky.classList.add('landed');
        moonFeedback.className = 'feedback success';
        moonFeedback.textContent = 'Есть посадка! Проверка пройдена.';
        sessionStorage.setItem(PASSED_KEY, 'passed');
        setTimeout(() => location.assign('quiz.html'), 1500);
    });
})();
