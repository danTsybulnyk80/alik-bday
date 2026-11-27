interface Question {
  text: string;
  // Any of these counts as correct. Case, punctuation and extra spaces are ignored.
  answers: string[];
  // Shown once the question has been answered wrong HINT_AFTER times.
  hint?: string;
}

const HINT_AFTER = 3;
// How long the "correct" animation plays before moving on.
const FEEDBACK_MS = 800;
// One confetti piece per this many square pixels of screen. Lower means more confetti.
const CONFETTI_DENSITY = 900;
const CONFETTI_COLORS = ['#e8457a', '#ffd24d', '#48cae4', '#7b1fa2', '#2ecc71', '#ff7b00', '#ffffff'];

// ---------------------------------------------------------------------------
// EDIT HERE: the three questions and the photo shown at the end.
// ---------------------------------------------------------------------------

const QUESTIONS: Question[] = [
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
const submit = byId<HTMLButtonElement>('submit');

let current = 0;
let attempts = 0;

function showQuestion(): void {
  const question = QUESTIONS[current];
  attempts = 0;
  progress.textContent = `Вопрос ${current + 1} из ${QUESTIONS.length}`;
  questionText.textContent = question.text;
  feedback.textContent = '';
  input.value = '';
  input.focus();
}

function showWrong(question: Question): void {
  attempts += 1;
  feedback.textContent =
    question.hint && attempts >= HINT_AFTER ? `Не совсем. Подсказка: ${question.hint}` : 'Не совсем, попробуй ещё раз.';
  animate('wrong');
  input.select();
}

// Plays the right/wrong answer animation on the card (see style.css).
function animate(result: 'correct' | 'wrong'): void {
  card.classList.remove('correct', 'wrong');
  void card.offsetWidth;
  card.classList.add(result);
}

interface ConfettiPiece {
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  angle: number;
  spin: number;
  // Phase of the flutter that makes a piece look like it is flipping.
  flip: number;
  flipSpeed: number;
  color: string;
}

// Endless, deliberately excessive confetti over the whole screen. It is meant to get in the way.
function startConfetti(): void {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  document.body.append(canvas);
  const context = canvas.getContext('2d');
  if (!context) return;

  const random = (min: number, max: number): number => min + Math.random() * (max - min);

  function createPiece(startY: number): ConfettiPiece {
    const width = random(14, 34);
    return {
      x: random(0, canvas.width),
      y: startY,
      width,
      height: width * random(0.4, 0.8),
      speedX: random(-1.5, 1.5),
      speedY: random(2, 6),
      angle: random(0, Math.PI * 2),
      spin: random(-0.15, 0.15),
      flip: random(0, Math.PI * 2),
      flipSpeed: random(0.05, 0.2),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    };
  }

  let pieces: ConfettiPiece[] = [];

  function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.round((canvas.width * canvas.height) / CONFETTI_DENSITY);
    // Start spread above the screen so the confetti pours in instead of appearing all at once.
    pieces = Array.from({ length: count }, () => createPiece(random(-canvas.height, 0)));
  }

  function draw(): void {
    context!.clearRect(0, 0, canvas.width, canvas.height);
    for (const piece of pieces) {
      piece.x += piece.speedX + Math.sin(piece.flip) * 1.5;
      piece.y += piece.speedY;
      piece.angle += piece.spin;
      piece.flip += piece.flipSpeed;
      if (piece.y > canvas.height + piece.width) {
        Object.assign(piece, createPiece(-piece.width));
      }
      context!.save();
      context!.translate(piece.x, piece.y);
      context!.rotate(piece.angle);
      context!.scale(1, Math.cos(piece.flip));
      context!.fillStyle = piece.color;
      context!.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      context!.restore();
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
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

  card.classList.remove('correct', 'wrong');
  card.classList.add('reveal');
  card.replaceChildren(title, image, caption);
  startConfetti();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = QUESTIONS[current];
  if (!isCorrect(question, input.value)) {
    showWrong(question);
    return;
  }
  feedback.textContent = '';
  animate('correct');
  // Block a second submit while the animation plays.
  submit.disabled = true;
  setTimeout(() => {
    submit.disabled = false;
    card.classList.remove('correct');
    current += 1;
    if (current < QUESTIONS.length) {
      showQuestion();
    } else {
      showPhoto();
    }
  }, FEEDBACK_MS);
});

// The quiz only opens after the captcha (captcha.html) has been passed in this tab.
if (sessionStorage.getItem('alik-bday-captcha') === 'passed') {
  showQuestion();
} else {
  location.replace('captcha.html');
}
