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
  ? Array.from(quizDataElement.querySelectorAll(".quiz-question")).map((item) => ({
      q: item.dataset.question,
      a: JSON.parse(item.dataset.answers),
      c: Number(item.dataset.correct)
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

function loadQuestion() {
  if (!questionText) {
    return;
  }

  answered = false;
  nextButton.disabled = true;

  const question = quizQuestions[questionIndex];
  quizProgress.textContent = `Question ${questionIndex + 1} of ${quizQuestions.length}`;
  questionText.textContent = question.q;
  answerButtons.innerHTML = "";

  question.a.forEach((answer, answerIndex) => {
    const button = document.createElement("button");
    button.className = "answer";
    button.textContent = answer;

    button.onclick = () => {
      if (answered) {
        return;
      }

      answered = true;
      nextButton.disabled = false;

      if (answerIndex === question.c) {
        button.classList.add("correct");
        score++;
      } else {
        button.classList.add("wrong");
        answerButtons.children[question.c].classList.add("correct");
      }

      if (typeof gtag === "function") {
        gtag("event", "quiz_answer", {
          question_number: questionIndex + 1,
          correct: answerIndex === question.c
        });
      }
    };

    answerButtons.appendChild(button);
  });
}

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

    questionText.textContent = "Quiz complete!";
    quizProgress.textContent = "Well done";
    answerButtons.innerHTML = "";
    nextButton.classList.add("hidden");
    quizResult.classList.remove("hidden");

    quizResult.innerHTML = `
      <h3>You scored ${score}/${quizQuestions.length}</h3>
      <p>Thanks for learning about Dong medicine.</p>
      <button class="button" onclick="restartQuiz()">Try Again</button>
    `;

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
      formMessage.textContent =
        "Please answer all required questions before submitting.";
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
    formMessage.textContent = "Submitting your feedback...";
    formMessage.classList.remove("error");

    const submitButton = questionnaireForm.querySelector(
      'button[type="submit"]'
    );

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
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
        formMessage.textContent =
          "Thank you! Your feedback has been recorded.";
        formMessage.classList.remove("error");

        formMessage.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        questionnaireForm.reset();

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Submit Feedback";
        }
      })
      .catch(function (error) {
        console.error("Questionnaire submission error:", error);

        formMessage.textContent =
          "Sorry, something went wrong. Please try again.";
        formMessage.classList.add("error");

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Submit Feedback";
        }
      });
  });
}