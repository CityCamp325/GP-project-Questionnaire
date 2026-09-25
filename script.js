// Shared navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

// Plant flashcards
const plants = [
  {
    name: "鬼针草",
    use: "Traditionally used in local herbal knowledge.",
    detail: "Add your team's exact traditional use and preparation information here."
  },
  {
    name: "燕尾草",
    use: "Traditionally associated with local herbal practices.",
    detail: "Add the information collected during your Zhaoxing fieldwork here."
  },
  {
    name: "地念",
    use: "A plant included in the traditional medicinal knowledge explored by our project.",
    detail: "Add the exact traditional use from your poster here."
  },
  {
    name: "刺天茄",
    use: "Included in our collection of plants connected with local traditional knowledge.",
    detail: "Add your fieldwork information here."
  },
  {
    name: "头花蓼",
    use: "Traditionally prepared and used according to local knowledge.",
    detail: "Add the traditional use and preparation method from your research."
  },
  {
    name: "南沙参",
    use: "A plant recorded as part of the traditional medicinal knowledge explored in this project.",
    detail: "Add your fieldwork information here."
  },
  {
    name: "车前草",
    use: "A locally known plant with traditional uses documented by the project.",
    detail: "Add the information from your poster here."
  },
  {
    name: "羊耳菊",
    use: "Included in our exploration of traditional medicinal plants.",
    detail: "Add your team's documented traditional use here."
  },
  {
    name: "千里光",
    use: "A plant documented through our research into local traditional knowledge.",
    detail: "Add your fieldwork information here."
  }
];

const flashcardGrid = document.getElementById("flashcardGrid");

if (flashcardGrid) {
  plants.forEach((plant, index) => {
    const card = document.createElement("div");
    card.className = "flashcard";
    card.innerHTML = `
      <div class="flashcard-inner">
        <div class="flash-front">
          <div class="plant-name" lang="zh">${plant.name}</div>
          <div class="tap">Tap to flip</div>
        </div>
        <div class="flash-back">
          <h3 lang="zh">${plant.name}</h3>
          <p><strong>Traditional use:</strong> ${plant.use}</p>
          <p>${plant.detail}</p>
          <div class="tap" style="color:#dceee6">Tap to flip back</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      card.classList.toggle("flipped");

      if (typeof gtag === "function") {
        gtag("event", "flashcard_flip", {
          card_number: index + 1,
          plant: plant.name
        });
      }
    });

    flashcardGrid.appendChild(card);
  });
}

// Quiz questions and state
const quizQuestions = [
  {
    q: "What is Dong medicine closely connected with?",
    a: [
      "Local plants and traditional knowledge",
      "Only modern pharmaceuticals",
      "Imported medical technology",
      "Computer science"
    ],
    c: 0
  },
  {
    q: "Which of these can be part of traditional plant preparation?",
    a: ["Boiling", "Drying", "Grinding", "All of the above"],
    c: 3
  },
  {
    q: "Why is learning about Dong medicine important?",
    a: [
      "It helps us understand local cultural knowledge",
      "It replaces modern medicine",
      "It proves every traditional use works",
      "It has no connection to culture"
    ],
    c: 0
  },
  {
    q: "What can traditional knowledge include?",
    a: [
      "Which part of a plant is used",
      "How a plant is traditionally prepared",
      "Knowledge passed between generations",
      "All of the above"
    ],
    c: 3
  },
  {
    q: "What is the main purpose of this website?",
    a: [
      "To provide medical treatment",
      "To sell medicine",
      "To spread awareness and share cultural knowledge",
      "To replace doctors"
    ],
    c: 2
  }
];

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
        score,
        total: quizQuestions.length
      });
    }
  };
}

function restartQuiz() {
  questionIndex = 0;
  score = 0;
  nextButton.classList.remove("hidden");
  quizResult.classList.add("hidden");
  loadQuestion();
}

loadQuestion();

// Questionnaire submission
const questionnaireForm = document.getElementById("questionnaireForm");

if (questionnaireForm) {
  questionnaireForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(questionnaireForm);
    const before = Number(data.get("before_level"));
    const after = Number(data.get("after_level"));

    if (typeof gtag === "function") {
      gtag("event", "questionnaire_submit", {
        heard_before: data.get("heard_before"),
        before_level: before,
        after_level: after,
        awareness_change: after - before,
        interest: data.get("interest")
      });
    }

    document.getElementById("formMessage").textContent =
      "Thank you! Your feedback has been recorded for our project.";
    questionnaireForm.reset();
  });
}
