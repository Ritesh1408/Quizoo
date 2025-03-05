document.addEventListener('DOMContentLoaded', function () {
    let quizData = null;
    let maxScores = {};  
    let quizHistory = []; 

    fetch('quiz-data.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
            initSections();
            loadPreviousAttempts();
        })
        .catch(error => console.error("Error loading quiz data:", error));

    function initSections() {
        let sections = document.querySelectorAll('.section');
        sections.forEach((section) => {
            section.addEventListener("click", () => {
                let sectionNumber = parseInt(section.getAttribute('data-section'));
                startQuiz(sectionNumber);
            });
        });
    }

    function startQuiz(index) {
        let topicName = quizData.sections[index].name; 
        let allQuestions = quizData.sections[index].questions;
        let currentQuestions = shuffleArray(allQuestions).slice(0, 10); 
        let currentQuestionIndex = 0;
        let score = 0;
        let answerSelected = false;
        let userAnswers = {}; 

        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("question-container").style.display = "block";
        document.getElementById("question-container").innerHTML = `
            <h2>${topicName} Quiz</h2>
            <p id="score">Score: 0</p>
            <p id="max-score">Max Score: ${maxScores[topicName] || 0}</p>
            <div id="question"></div>
            <div id="options"></div>
            <button id="prev-button" disabled>Previous</button>
            <button id="next-button">Next</button>
        `;

        showQuestions();

        function showQuestions() {
            const question = currentQuestions[currentQuestionIndex];
            const questionElement = document.getElementById("question");
            const optionsElement = document.getElementById("options");

            questionElement.textContent = question.question;
            optionsElement.innerHTML = "";
            answerSelected = false;

            if (question.questionType === "mcq") {
                question.options.forEach((option, index) => {
                    const optionElement = document.createElement("div");
                    optionElement.textContent = option;
                    optionElement.classList.add("option");

                    if (userAnswers[currentQuestionIndex] !== undefined) {
                        optionElement.classList.add(userAnswers[currentQuestionIndex].isCorrect ? "correct" : "wrong");
                        optionElement.style.pointerEvents = "none";
                    }

                    optionElement.addEventListener("click", function () {
                        if (!answerSelected && userAnswers[currentQuestionIndex] === undefined) {
                            answerSelected = true;
                            optionElement.classList.add("selected");
                            checkAnswer(option, question.answer, index);
                        }
                    });

                    optionsElement.appendChild(optionElement);
                });
            } else {
                const inputElement = document.createElement("input");
                inputElement.type = question.questionType === "number" ? "number" : "text";

                const submitButton = document.createElement("button");
                submitButton.textContent = "Submit Answer";
                submitButton.className = "submit-answer";

                submitButton.onclick = () => {
                    if (!answerSelected && userAnswers[currentQuestionIndex] === undefined) {
                        answerSelected = true;
                        checkAnswer(inputElement.value.toString(), question.answer.toString());
                    }
                };

                optionsElement.appendChild(inputElement);
                optionsElement.appendChild(submitButton);
            }

            function checkAnswer(givenAnswer, correctAnswer, optionIndex = null) {
                const feedbackElement = document.createElement("div");
                feedbackElement.id = "feedback";

                let isCorrect = givenAnswer.toLowerCase() === correctAnswer.toLowerCase();
                if (isCorrect) {
                    score++;
                    feedbackElement.textContent = "Correct!";
                    feedbackElement.style.color = "green";
                } else {
                    feedbackElement.textContent = `Wrong! Correct Answer: ${correctAnswer}`;
                    feedbackElement.style.color = "red";
                }

                optionsElement.appendChild(feedbackElement);
                updateScore();

                userAnswers[currentQuestionIndex] = { givenAnswer, isCorrect };

                let allOptions = document.querySelectorAll(".option");
                allOptions.forEach((opt, idx) => {
                    opt.style.pointerEvents = "none";
                    if (idx === optionIndex) {
                        opt.classList.add(isCorrect ? "correct" : "wrong");
                    }
                });
            }

            function updateScore() {
                document.getElementById("score").textContent = "Score: " + score;
            }

            document.getElementById("prev-button").disabled = currentQuestionIndex === 0;
        }

        function endQuiz() {
            let questionContainer = document.getElementById("question-container");
            let quizContainer = document.getElementById("quiz-container");

            if (!maxScores[topicName] || score > maxScores[topicName]) {
                maxScores[topicName] = score;
            }
            localStorage.setItem("maxScores", JSON.stringify(maxScores));

            quizHistory.push({ topic: topicName, score, total: currentQuestions.length, date: new Date().toLocaleString() });
            localStorage.setItem("quizHistory", JSON.stringify(quizHistory));

            questionContainer.innerHTML = `
                <h1>Quiz Completed!</h1>
                <p>Your Final Score: ${score}/${currentQuestions.length}</p>
                <p>Best Score for ${topicName}: ${maxScores[topicName]}</p>
                <button id="home-button">Go to Home</button>
            `;
            document.getElementById('home-button').addEventListener('click', function () {
                quizContainer.style.display = "grid";
                questionContainer.style.display = "none";
                loadPreviousAttempts();
            });
        }

        document.getElementById("next-button").addEventListener("click", () => {
            if (currentQuestionIndex === currentQuestions.length - 1) {
                endQuiz();
            } else {
                currentQuestionIndex++;
                showQuestions();
            }
        });

        document.getElementById("prev-button").addEventListener("click", () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                showQuestions();
            }
        });

        function shuffleArray(array) {
            let shuffled = [...array];
            let currentIndex = shuffled.length, randomIndex;
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
            }
            return shuffled;
        }
    }

    function loadPreviousAttempts() {
        let attemptsContainer = document.getElementById("previous-attempts");
        if (!attemptsContainer) return; 

        let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
        quizHistory = history;
        attemptsContainer.innerHTML = "<h3>Previous Quiz Attempts</h3>";

        history.slice().reverse().forEach((attempt, index) => {
            let attemptDiv = document.createElement("div");
            attemptDiv.classList.add("attempt");
            attemptDiv.innerHTML = `<strong>${attempt.topic}</strong> - Score: ${attempt.score}/${attempt.total} (Date: ${attempt.date})`;
            attemptsContainer.appendChild(attemptDiv);
        });
    }
});
