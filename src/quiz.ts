interface Question {
  text: string;
  // Any of these counts as correct. Case, punctuation and extra spaces are ignored.
  answers: string[];
  // Shown after the first wrong attempt.
  hint?: string;
}

// ---------------------------------------------------------------------------
// EDIT HERE: the three questions and the photo shown at the end.
// ---------------------------------------------------------------------------

const QUESTIONS: Question[] = [
  {
    text: 'Здесь будет вопрос 1?',
    answers: ['первый ответ', 'другой вариант написания'],
    hint: 'Подсказка к вопросу 1',
  },
  {
    text: 'Здесь будет вопрос 2?',
    answers: ['второй ответ'],
    hint: 'Подсказка к вопросу 2',
  },
  {
    text: 'Здесь будет вопрос 3?',
    answers: ['третий ответ'],
    hint: 'Подсказка к вопросу 3',
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

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCorrect(question: Question, value: string): boolean {
  const given = normalize(value);
  return given !== '' && question.answers.some((answer) => normalize(answer) === given);
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

const card = byId<HTMLElement>('card');
const form = byId<HTMLFormElement>('quiz-form');
const progress = byId<HTMLElement>('progress');
const questionText = byId<HTMLElement>('question-text');
const input = byId<HTMLInputElement>('answer');
const feedback = byId<HTMLElement>('feedback');

let current = 0;

function showQuestion(): void {
  const question = QUESTIONS[current];
  progress.textContent = `Вопрос ${current + 1} из ${QUESTIONS.length}`;
  questionText.textContent = question.text;
  feedback.textContent = '';
  input.value = '';
  input.focus();
}

function showWrong(question: Question): void {
  feedback.textContent = question.hint ? `Не совсем. Подсказка: ${question.hint}` : 'Не совсем, попробуй ещё раз.';
  // Restart the shake animation on every wrong attempt.
  card.classList.remove('shake');
  void card.offsetWidth;
  card.classList.add('shake');
  input.select();
}

function showPhoto(): void {
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
  } else {
    showPhoto();
  }
});

showQuestion();
