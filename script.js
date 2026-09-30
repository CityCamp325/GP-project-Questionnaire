// ========================================
// SHARED NAVIGATION
// ========================================
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
    });
}

function getLocalizedHtmlText(element, key) {
    const language = document.documentElement.lang === "zh-CN" ? "zh" : "en";
    if (language === "en") {
        return element?.getAttribute(`data-${key}-en`) || "";
    }

    const translationKey = element?.getAttribute(`data-${key}-i18n`);
    const translation = translationKey && window.getSiteTranslation?.(translationKey);
    return Array.isArray(translation) ? JSON.stringify(translation) : translation || "";
}

// ========================================
// FLASHCARDS
// ========================================
const flashcardGrid = document.getElementById("flashcardGrid");

if (flashcardGrid) {
    const cards = flashcardGrid.querySelectorAll(".flashcard");

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");

            if (typeof gtag === "function") {
                gtag("event", "flashcard_flip");
            }
        });
    });
}

// ========================================
// QUIZ QUESTIONS AND STATE
// ========================================
const quizDataElement = document.getElementById("quizData");
const quizQuestions = quizDataElement
    ? Array.from(quizDataElement.querySelectorAll(".quiz-question")).map((element) => ({
            element,
            correctAnswer: Number(element.dataset.correct)
        }))
    : [];

let questionIndex = 0;
let score = 0;
let answered = false;

const questionText = document.getElementById("questionText");
const answerButtons = document.getElementById("answerButtons");
const quizProgress = document.getElementById("quizProgress");
const nextButton = document.getElementById("nextButton");
const quizResult = document.getElementById("quizResult");
const quizBox = questionText?.closest(".quiz-box");

function loadQuestion() {
    if (!questionText) {
        return;
    }

    answered = false;
    nextButton.disabled = true;

    const question = quizQuestions[questionIndex];
    const answers = JSON.parse(getLocalizedHtmlText(question.element, "answers"));
    quizProgress.textContent = getLocalizedHtmlText(quizBox, "progress")
        .replace("{current}", questionIndex + 1)
        .replace("{total}", quizQuestions.length);
    questionText.textContent = getLocalizedHtmlText(question.element, "question");
    answerButtons.innerHTML = "";

    answers.forEach((answer, answerIndex) => {
        const button = document.createElement("button");
        button.className = "answer";
        button.textContent = answer;
        button.dataset.answerIndex = answerIndex;

        button.onclick = () => {
            if (answered) {
                return;
            }

            answered = true;
            nextButton.disabled = false;

            if (answerIndex === question.correctAnswer) {
                button.classList.add("correct");
                score++;
            } else {
                button.classList.add("wrong");
                answerButtons.children[question.correctAnswer].classList.add("correct");
            }

            if (typeof gtag === "function") {
                gtag("event", "quiz_answer", {
                    question_number: questionIndex + 1,
                    correct: answerIndex === question.correctAnswer
                });
            }
        };

        answerButtons.appendChild(button);
    });
}

function renderQuizResult() {
    const question = getLocalizedHtmlText(quizBox, "complete-title");
    const progress = getLocalizedHtmlText(quizBox, "well-done");
    const scoreText = getLocalizedHtmlText(quizBox, "score")
        .replace("{score}", score)
        .replace("{total}", quizQuestions.length);
    const thanks = getLocalizedHtmlText(quizBox, "thanks");
    const tryAgain = getLocalizedHtmlText(quizBox, "try-again");

    questionText.textContent = question;
    quizProgress.textContent = progress;
    answerButtons.innerHTML = "";
    nextButton.classList.add("hidden");
    quizResult.classList.remove("hidden");
    quizResult.innerHTML = `<h3>${scoreText}</h3><p>${thanks}</p><button class="button" onclick="restartQuiz()">${tryAgain}</button>`;
}

function updateQuizLanguage() {
    if (!questionText) {
        return;
    }

    if (!quizResult.classList.contains("hidden")) {
        renderQuizResult();
        return;
    }

    const question = quizQuestions[questionIndex];
    questionText.textContent = getLocalizedHtmlText(question.element, "question");
    quizProgress.textContent = getLocalizedHtmlText(quizBox, "progress")
        .replace("{current}", questionIndex + 1)
        .replace("{total}", quizQuestions.length);

    Array.from(answerButtons.children).forEach((button) => {
        const answers = JSON.parse(getLocalizedHtmlText(question.element, "answers"));
        button.textContent = answers[Number(button.dataset.answerIndex)];
    });
}

document.addEventListener("site-language-changed", updateQuizLanguage);

// ========================================
// QUIZ NEXT BUTTON
// ========================================
if (nextButton) {
    nextButton.onclick = () => {
        questionIndex++;

        if (questionIndex < quizQuestions.length) {
            loadQuestion();
            return;
        }

        renderQuizResult();

        if (typeof gtag === "function") {
            gtag("event", "quiz_complete", {
                score: score,
                total: quizQuestions.length
            });
        }
    };
}

// ========================================
// RESTART QUIZ
// ========================================
function restartQuiz() {
    questionIndex = 0;
    score = 0;
    nextButton.classList.remove("hidden");
    quizResult.classList.add("hidden");
    loadQuestion();
}

loadQuestion();
