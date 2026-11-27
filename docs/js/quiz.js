"use strict";
const HINT_AFTER = 3;
// ---------------------------------------------------------------------------
// EDIT HERE: the three questions and the photo shown at the end.
// ---------------------------------------------------------------------------
const QUESTIONS = [
    {
        text: 'Любимая фраза gravedigger',
        answers: ['been to go', 'бин ту го'],
        hint: 'been ...',
    },
    {
        text: 'Первый вопрос незнакомцу?',
        answers: ['какой рейтинг'],
        hint: 'какой....',
    },
    {
        text: 'Название ракеты для полёта на луну',
        answers: ['попа'],
        hint: 'п..а',
    },
];
const PHOTO = {
    // Paths relative to the docs/ folder. The photo is uploaded through upload.html.
    src: 'photos/location.jpg',
    // Shown until a photo has been uploaded.
    placeholder: 'photos/location.svg',
    title: 'У тебя получилось!',
    caption: 'Твой подарок ждёт тебя здесь.',
};
// ---------------------------------------------------------------------------
function normalize(value) {
    return value
        .normalize('NFKC')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^\p{L}\p{N}\s]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function isCorrect(question, value) {
    const given = normalize(value);
    return given !== '' && question.answers.some((answer) => normalize(answer) === given);
}
function byId(id) {
    const element = document.getElementById(id);
    if (!element)
        throw new Error(`Missing element #${id}`);
    return element;
}
const card = byId('card');
const form = byId('quiz-form');
const progress = byId('progress');
const questionText = byId('question-text');
const input = byId('answer');
const feedback = byId('feedback');
let current = 0;
let attempts = 0;
function showQuestion() {
    const question = QUESTIONS[current];
    attempts = 0;
    progress.textContent = `Вопрос ${current + 1} из ${QUESTIONS.length}`;
    questionText.textContent = question.text;
    feedback.textContent = '';
    input.value = '';
    input.focus();
}
function showWrong(question) {
    attempts += 1;
    feedback.textContent =
        question.hint && attempts >= HINT_AFTER ? `Не совсем. Подсказка: ${question.hint}` : 'Не совсем, попробуй ещё раз.';
    // Restart the shake animation on every wrong attempt.
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    input.select();
}
function showPhoto() {
    const title = document.createElement('h1');
    title.textContent = PHOTO.title;
    const image = document.createElement('img');
    image.className = 'photo';
    image.onerror = () => {
        image.onerror = null;
        image.src = PHOTO.placeholder;
    };
    // The timestamp stops the browser from showing a stale copy after a new upload.
    image.src = `${PHOTO.src}?v=${Date.now()}`;
    image.alt = PHOTO.caption;
    const caption = document.createElement('p');
    caption.textContent = PHOTO.caption;
    card.classList.remove('shake');
    card.classList.add('reveal');
    card.replaceChildren(title, image, caption);
}
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = QUESTIONS[current];
    if (!isCorrect(question, input.value)) {
        showWrong(question);
        return;
    }
    current += 1;
    if (current < QUESTIONS.length) {
        showQuestion();
    }
    else {
        showPhoto();
    }
});
// The quiz only opens after the captcha (captcha.html) has been passed in this tab.
if (sessionStorage.getItem('alik-bday-captcha') === 'passed') {
    showQuestion();
}
else {
    location.replace('captcha.html');
}
