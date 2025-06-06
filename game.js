document.addEventListener('DOMContentLoaded', () => {
  const gameBoard = document.getElementById('game-board');
  const movesDisplay = document.getElementById('moves');
  const timeDisplay = document.getElementById('time');
  const levelButtons = document.querySelectorAll('.game-btn');
  const volumeToggle = document.getElementById('volumeToggle');

  // Sound effects
  const sounds = {
    flip: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-card-flip-1560.mp3'),
    match: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'),
    win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
    button: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
    background: new Audio('https://assets.mixkit.co/music/preview/mixkit-game-show-suspense-waiting-668.mp3')
  };

  // Initialize audio settings
  sounds.background.volume = 0.3;
  sounds.background.loop = true;
  let isMuted = false;

  // Volume control
  if (volumeToggle) {
    volumeToggle.addEventListener('click', () => {
      isMuted = !isMuted;
      Object.values(sounds).forEach(sound => {
        sound.muted = isMuted;
      });
      volumeToggle.textContent = isMuted ? "🔇" : "🔊";
    });
  }

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

  // Initialize game
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('button');
      const level = btn.dataset.level;
      currentLevel = level;
      playSound('background');
      startGame(levels[level]);
    });
  });

  function playSound(soundName) {
    if (!isMuted && sounds[soundName]) {
      sounds[soundName].currentTime = 0; // Rewind sound if already playing
      sounds[soundName].play().catch(e => console.log("Audio play failed:", e));
    }
  }

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
  }

  function createCards(pairs) {
    const cards = [];
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'];
    const selectedEmojis = emojis.slice(0, pairs);
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

    playSound('flip');
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
    playSound('match');
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
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
      sounds.background.pause();
      playSound('win');
      celebrateWin();
    }
  }

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
      "Perfect! 🧠", "You nailed it! 💯", "Congratulations! 🎊"
    ];
    
    const winMessage = document.createElement('div');
    winMessage.className = 'win-message';
    winMessage.innerHTML = `
      <h3>${messages[Math.floor(Math.random() * messages.length)]}</h3>
      <p>Completed in ${moves} moves and ${seconds} seconds!</p>
      <div class="win-options">
        <button class="btn play-again">Play Again</button>
        <button class="btn return-home">Return to Portfolio</button>
      </div>
    `;
    
    document.body.append(celebration, winMessage);
    
    // Button handlers
    document.querySelector('.play-again').addEventListener('click', () => {
      playSound('button');
      removeCelebration();
      playSound('background');
      startGame(levels[currentLevel]);
    });
    
    document.querySelector('.return-home').addEventListener('click', () => {
      playSound('button');
      removeCelebration();
      sounds.background.pause();
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
  }
});