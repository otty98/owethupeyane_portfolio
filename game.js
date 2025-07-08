document.addEventListener('DOMContentLoaded', () => {
  const gameBoard = document.getElementById('game-board');
  const movesDisplay = document.getElementById('moves');
  const timeDisplay = document.getElementById('time');
  const levelButtons = document.querySelectorAll('.game-btn');
  const highscoreDisplay = document.getElementById('highscore');

  let cards = [];
  let hasFlippedCard = false;
  let lockBoard = false;
  let firstCard, secondCard;
  let moves = 0;
  let timer;
  let seconds = 0;
  let matchedPairs = 0;
  let currentLevel = null;

  // Game levels
  const levels = {
    easy: { pairs: 8, cols: 4 },
    medium: { pairs: 18, cols: 6 },
    hard: { pairs: 32, cols: 8 }
  };

  // Define themes object
  const themes = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    fruits: ['🍎', '🍌', '🍓', '🍇', '🍉', '🍒', '🍑', '🍍', '🥝', '🥭', '🍐', '🍋', '🍊', '🥥', '🍈'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🏓', '🏸', '🥊', '🥋', '⛷️', '🏂', '🏒']
  };
  let currentTheme = 'animals'; // Set default to one of them


  // Initialize leaderboard and unlockedLevels at the top scope
  const leaderboard = {
    easy: { moves: Infinity, time: Infinity },
    medium: { moves: Infinity, time: Infinity },
    hard: { moves: Infinity, time: Infinity }
  };

  const unlockedLevels = {
    easy: true, // Easy is always unlocked
    medium: false,
    hard: false
  };

  // Initialize achievements at the top scope
  const achievements = {
    speedDemon: false,
    memoryMaster: false,
    perfectGame: false
  };

  // Load existing high scores from localStorage
  function loadHighScores() {
    for (const level in leaderboard) {
      const storedMoves = localStorage.getItem(`memory-highscore-${level}-moves`);
      const storedTime = localStorage.getItem(`memory-highscore-${level}-time`);
      if (storedMoves !== null) {
        leaderboard[level].moves = parseInt(storedMoves);
      }
      if (storedTime !== null) {
        leaderboard[level].time = parseInt(storedTime);
      }
    }
  }

  // Save high scores to localStorage
  function saveHighScores() {
    for (const level in leaderboard) {
      if (leaderboard[level].moves !== Infinity) {
        localStorage.setItem(`memory-highscore-${level}-moves`, leaderboard[level].moves);
      }
      if (leaderboard[level].time !== Infinity) {
        localStorage.setItem(`memory-highscore-${level}-time`, leaderboard[level].time);
      }
    }
  }

  // Update high score display
  function updateHighScoreDisplay() {
    if (currentLevel && leaderboard[currentLevel].moves !== Infinity) {
    highscoreDisplay.textContent = `${leaderboard[currentLevel].moves} moves in ${leaderboard[currentLevel].time}s`;
    } else {
      highscoreDisplay.textContent = '-';
    }
  }

  // Disable initially locked levels
  function updateLevelButtonStates() {
    document.querySelector('.game-btn[data-level="medium"]').disabled = !unlockedLevels.medium;
    document.querySelector('.game-btn[data-level="hard"]').disabled = !unlockedLevels.hard;
  }

  // Initial load of high scores and update button states when the DOM content is loaded
  loadHighScores();
  updateLevelButtonStates();
  updateHighScoreDisplay(); // Ensure high score display is updated on load

  // Initialize game
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const level = btn.dataset.level;
      // Only start game if the level is unlocked
      if (unlockedLevels[level]) {
        currentLevel = level;
        startGame(levels[level]);
      }
    });
  });

  function startGame(level) {
    // Reset game state
    clearInterval(timer);
    seconds = 0;
    moves = 0;
    matchedPairs = 0;
    updateStats();

    // Clear any existing elements
    gameBoard.innerHTML = '';
    removeCelebration();

    // Create and shuffle cards
    cards = createCards(level.pairs);
    shuffleCards(cards);

    // Setup board
    gameBoard.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
    cards.forEach(card => gameBoard.appendChild(card));

    // Start timer
    timer = setInterval(() => {
      seconds++;
      timeDisplay.textContent = seconds;
    }, 1000);

    // Update the high score display for the current level
    updateHighScoreDisplay();
  }

  function createCards(pairs) {
    const cards = [];
    const selectedEmojis = themes[currentTheme].slice(0, pairs);
    const cardValues = [...selectedEmojis, ...selectedEmojis];

    cardValues.forEach(emoji => {
      const card = document.createElement('div');
      card.className = 'memory-card';
      card.dataset.value = emoji;

      card.innerHTML = `
        <div class="back-face"></div>
        <div class="front-face">${emoji}</div>
      `;

      card.addEventListener('click', flipCard);
      cards.push(card);
    });

    return cards;
  }

  function shuffleCards(cards) {
    cards.forEach(card => {
      card.style.order = Math.floor(Math.random() * cards.length);
    });
  }

  function flipCard() {
    if (lockBoard || this === firstCard) return;

    this.classList.add('flip');

    if (!hasFlippedCard) {
      hasFlippedCard = true;
      firstCard = this;
      return;
    }

    secondCard = this;
    moves++;
    updateStats();
    checkForMatch();
  }

  function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;
    isMatch ? handleMatch() : handleMismatch();
  }

  function handleMatch() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-effect';
    sparkle.style.left = `${firstCard.offsetLeft + firstCard.offsetWidth / 2}px`;
    sparkle.style.top = `${firstCard.offsetTop + firstCard.offsetHeight / 2}px`;
    gameBoard.appendChild(sparkle);

    setTimeout(() => sparkle.remove(), 1000);
    matchedPairs++;
    checkWinCondition();
    resetBoard();
  }

  function handleMismatch() {
    lockBoard = true;
    setTimeout(() => {
      firstCard.classList.remove('flip');
      secondCard.classList.remove('flip');
      resetBoard();
    }, 1000);
  }

  function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
  }

  function updateStats() {
    movesDisplay.textContent = moves;
  }


  function checkWinCondition() {
    if (matchedPairs === cards.length / 2) {
      clearInterval(timer);

      // Update leaderboard if this is a new best for the current level
      if (moves < leaderboard[currentLevel].moves || (moves === leaderboard[currentLevel].moves && seconds < leaderboard[currentLevel].time)) {
        leaderboard[currentLevel].moves = moves;
        leaderboard[currentLevel].time = seconds;
        saveHighScores(); // Save updated scores
        showHighScoreMessage(moves, seconds);
      }

      // Check for achievements
      checkAchievements();

      // Unlock next level if applicable
      if (currentLevel === 'easy' && !unlockedLevels.medium) {
        unlockedLevels.medium = true;
        updateLevelButtonStates(); // Update button state
      } else if (currentLevel === 'medium' && !unlockedLevels.hard) {
        unlockedLevels.hard = true;
        updateLevelButtonStates(); // Update button state
      }

      celebrateWin();
    }
  }


  function showHighScoreMessage(score, time) {
    const message = document.createElement('div');
    message.className = 'highscore-message';
    message.textContent = `New High Score for ${currentLevel} level: ${score} moves, ${time}s!`;
    gameBoard.parentNode.insertBefore(message, gameBoard.nextSibling);
    setTimeout(() => message.remove(), 3000);
  }


  function checkAchievements() {
    // Speed Demon - complete game in under 60 seconds
    if (seconds < 60 && !achievements.speedDemon) {
      achievements.speedDemon = true;
      showAchievement('Speed Demon', 'Completed a game in under 60 seconds!');
    }

    // Memory Master - complete all levels
    if (unlockedLevels.hard && !achievements.memoryMaster) {
      achievements.memoryMaster = true;
      showAchievement('Memory Master', 'Completed all difficulty levels!');
    }

    // Perfect Game - complete with no mismatches
    if (matchedPairs * 2 === moves && !achievements.perfectGame) {
      achievements.perfectGame = true;
      showAchievement('Perfect Game', 'Completed with no mismatched cards!');
    }
  }

  // Add achievement display
  function showAchievement(title, description) {
    const achievement = document.createElement('div');
    achievement.className = 'achievement-notification';
    achievement.innerHTML = `
    <div class="achievement-badge">🏆</div>
    <div class="achievement-text">
      <h4>${title}</h4>
      <p>${description}</p>
    </div>
  `;
    document.body.appendChild(achievement);

    setTimeout(() => {
      achievement.classList.add('show');
      setTimeout(() => {
        achievement.classList.remove('show');
        setTimeout(() => achievement.remove(), 500);
      }, 3000);
    }, 100);
  }

  // Add theme switching
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('theme-btn')) {
      currentTheme = e.target.dataset.theme;
      document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');

      // 🔥 Restart game with new theme if a level is active
      if (currentLevel) {
        startGame(levels[currentLevel]);
      }
    }
  });


  function removeCelebration() {
    const existingCelebration = document.querySelector('.celebration');
    const existingMessage = document.querySelector('.win-message');
    if (existingCelebration) existingCelebration.remove();
    if (existingMessage) existingMessage.remove();
  }

  function celebrateWin() {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';

    // Create balloons and confetti
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    for (let i = 0; i < 150; i++) {
      const element = document.createElement('div');
      if (i < 50) {
        // Balloons
        element.className = 'balloon';
        element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        element.style.animationDuration = `${4 + Math.random() * 3}s`;
      } else {
        // Confetti
        element.className = 'confetti';
        element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        element.style.animationDuration = `${2 + Math.random() * 3}s`;
        element.style.width = `${5 + Math.random() * 10}px`;
        element.style.height = `${5 + Math.random() * 10}px`;
      }
      element.style.left = `${Math.random() * 100}%`;
      celebration.appendChild(element);
    }

    // Win message
    const messages = [
      "Amazing! 🎉", "Memory Master! 🏆", "Incredible! 👏",
      "Perfect! 🧠", "You nailed it! 💯", "Congratulations! 🎊",
    ];

    const winMessage = document.createElement('div');
    winMessage.className = 'win-message';
    winMessage.innerHTML = `
      <h3>${messages[Math.floor(Math.random() * messages.length)]}</h3>
      <p>Completed in ${moves} moves and ${seconds} seconds!</p>
      <div class="leaderboard">
        <h4>Best Scores</h4>
        <p>Easy: ${leaderboard.easy.moves === Infinity ? '-' : `${leaderboard.easy.moves} moves, ${leaderboard.easy.time}s`}</p>
        <p>Medium: ${leaderboard.medium.moves === Infinity ? '-' : `${leaderboard.medium.moves} moves, ${leaderboard.medium.time}s`}</p>
        <p>Hard: ${leaderboard.hard.moves === Infinity ? '-' : `${leaderboard.hard.moves} moves, ${leaderboard.hard.time}s`}</p>
      </div>
      <div class="win-options">
        <button class="btn play-again">Play Again</button>
        <button class="btn return-home">Return to Portfolio</button>
      </div>
    `;

    document.body.append(celebration, winMessage);

    // Button handlers
    document.querySelector('.play-again').addEventListener('click', () => {
      removeCelebration();
      startGame(levels[currentLevel]);
    });

    document.querySelector('.return-home').addEventListener('click', () => {
      removeCelebration();
      resetGameState();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function resetGameState() {
    clearInterval(timer);
    gameBoard.innerHTML = '';
    cards = [];
    hasFlippedCard = lockBoard = false;
    firstCard = secondCard = null;
    moves = seconds = matchedPairs = 0;
    movesDisplay.textContent = timeDisplay.textContent = '0';
    updateHighScoreDisplay(); // Reset high score display as well
  }
});