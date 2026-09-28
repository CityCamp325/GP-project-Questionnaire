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
    return element?.getAttribute(`data-${key}-${language}`) || "";
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

// ========================================
// QUESTIONNAIRE SUBMISSION
// ========================================
const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxeU9_7DXT5yXlvfQemukwl-mHR7wADnuo_IgrIhOZ99_SAj29HaH40eQODB3DpG08cvA/exec";

const questionnaireForm = document.getElementById("questionnaireForm");

if (questionnaireForm) {
    questionnaireForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const formMessage = document.getElementById("formMessage");

        // ========================================
        // CHECK REQUIRED QUESTIONS
        // ========================================
        const data = new FormData(questionnaireForm);
        const heardBefore = data.get("heard_before");
        const beforeLevel = data.get("before_level");
        const afterLevel = data.get("after_level");
        const interest = data.get("interest");

        if (!heardBefore || !beforeLevel || !afterLevel || !interest) {
            formMessage.textContent = getLocalizedHtmlText(formMessage, "required-error");
            formMessage.classList.add("error");

            formMessage.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            return;
        }

        // ========================================
        // GET Q4 CHECKBOX ANSWERS
        // ========================================
        const learnedAnswers = data.getAll("learned");
        const learned = learnedAnswers.join("; ");

        // ========================================
        // GET OPTIONAL QUESTIONS
        // ========================================
        const learnedToday = data.get("learned_text") || "";
        const suggestions = data.get("suggestions") || "";

        // ========================================
        // SHOW SUBMITTING MESSAGE
        // ========================================
        formMessage.textContent = getLocalizedHtmlText(formMessage, "submitting-message");
        formMessage.classList.remove("error");

        const submitButton = questionnaireForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = getLocalizedHtmlText(submitButton, "pending");
        }

        // ========================================
        // SEND DATA TO GOOGLE SHEETS
        // ========================================
        const submissionData = new URLSearchParams();

        submissionData.append("heardBefore", heardBefore);
        submissionData.append("beforeLevel", beforeLevel);
        submissionData.append("afterLevel", afterLevel);
        submissionData.append("learned", learned);
        submissionData.append("interest", interest);
        submissionData.append("learnedToday", learnedToday);
        submissionData.append("suggestions", suggestions);

        fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            body: submissionData
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Questionnaire submission failed");
                }
                return response;
            })
            .then(function () {
                // ========================================
                // GOOGLE ANALYTICS
                // ========================================
                // Only record that the questionnaire
                // was successfully submitted.
                // No questionnaire answers are sent to GA.

                if (typeof gtag === "function") {
                    gtag("event", "questionnaire_submit");
                }

                // ========================================
                // SUCCESS MESSAGE
                // ========================================
                formMessage.textContent = getLocalizedHtmlText(formMessage, "success");
                formMessage.classList.remove("error");

                formMessage.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                questionnaireForm.reset();

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = getLocalizedHtmlText(submitButton, "label");
                }
            })
            .catch(function (error) {
                console.error("Questionnaire submission error:", error);

                formMessage.textContent = getLocalizedHtmlText(formMessage, "failure");
                formMessage.classList.add("error");

                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = getLocalizedHtmlText(submitButton, "label");
                }
            });
    });
}