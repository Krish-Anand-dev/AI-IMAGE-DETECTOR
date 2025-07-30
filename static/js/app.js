
    const URL = "./model/";
    let model, webcam, maxPredictions;
    let counts = { cat: 0, dog: 0, man: 0 };
    let totalImages = 0;
    const maxImages = 5;

    async function init() {
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      // Add loading animation
      document.getElementById("result").classList.add('loading');

      try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        webcam = new tmImage.Webcam(400, 300, true);
        await webcam.setup();
        await webcam.play();
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        // Remove loading animation
        document.getElementById("result").classList.remove('loading');
        document.getElementById("result").innerText = "Model loaded and running...";

        startCountdownLoop();
      } catch (error) {
        document.getElementById("result").classList.remove('loading');
        document.getElementById("result").innerText = "Error loading model. Please refresh.";
      }
    }

    async function startCountdownLoop() {
      if (totalImages >= maxImages) {
        displayWinner();
        return;
      }

      // Create countdown overlay on live webcam feed
      const webcamContainer = document.getElementById("webcam-container");
      const overlay = document.createElement('div');
      overlay.id = 'webcam-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: #FFD700;
        padding: 20px 30px;
        border-radius: 50%;
        font-size: 4rem;
        font-weight: bold;
        text-shadow: 0 0 20px #FFD70088;
        z-index: 10;
        border: 3px solid #FFD700;
        box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
        min-width: 100px;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      `;
      
      // Make webcam container relative for overlay positioning
      webcamContainer.style.position = 'relative';
      webcamContainer.appendChild(overlay);

      let countdown = 5;
      const countdownElem = document.getElementById("countdown");
      countdownElem.innerText = `⏳ Get ready! Pose in ${countdown} seconds...`;

      const interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          // Update overlay with countdown number
          overlay.innerText = countdown;
          countdownElem.innerText = `⏳ Get ready! Pose in ${countdown} seconds...`;
          
          // Add pulse effect to overlay
          overlay.style.transform = 'translate(-50%, -50%) scale(1.2)';
          overlay.style.background = 'rgba(255, 215, 0, 0.9)';
          overlay.style.color = '#000';
          
          setTimeout(() => {
            overlay.style.transform = 'translate(-50%, -50%) scale(1)';
            overlay.style.background = 'rgba(0, 0, 0, 0.7)';
            overlay.style.color = '#FFD700';
          }, 300);
          
          // Add subtle pulse effect to countdown element
          countdownElem.style.transform = 'scale(1.05)';
          setTimeout(() => {
            countdownElem.style.transform = 'scale(1)';
          }, 100);
        } else {
          clearInterval(interval);
          
          // Final capture moment
          overlay.innerText = '📸';
          overlay.style.background = 'rgba(255, 215, 0, 0.95)';
          overlay.style.color = '#000';
          overlay.style.transform = 'translate(-50%, -50%) scale(1.3)';
          countdownElem.innerText = `📸 Say Cheese!`;
          
          // Flash effect
          document.body.style.filter = 'brightness(1.8)';
          setTimeout(() => {
            document.body.style.filter = 'brightness(1)';
          }, 200);
          
          // Remove overlay and capture after brief moment
          setTimeout(() => {
            webcamContainer.removeChild(overlay);
            document.getElementById("countdown").classList.add('loading');
            capturePrediction();
          }, 800);
        }
      }, 1000);
    }

    async function capturePrediction() {
      webcam.update();
      const prediction = await model.predict(webcam.canvas);
      prediction.sort((a, b) => b.probability - a.probability);
      const top = prediction[0];

      if (top.probability > 0.7) {
        const label = top.className.toLowerCase();
        if (label in counts) {
          counts[label]++;
        }
      }

      totalImages++;
      
      // Remove loading animation
      document.getElementById("countdown").classList.remove('loading');
      
      // Smooth content updates
      const resultElem = document.getElementById("result");
      const counterElem = document.getElementById("counter");
      
      resultElem.style.opacity = '0.7';
      counterElem.style.opacity = '0.7';
      
      setTimeout(() => {
        resultElem.innerText = `Detected: ${top.className} (${(top.probability * 100).toFixed(1)}%)`;
        counterElem.innerText = `Images counted: ${totalImages}`;
        resultElem.style.opacity = '1';
        counterElem.style.opacity = '1';
      }, 150);
      
      updateLeaderboard();
      
      // Add a brief pause before starting next countdown
      setTimeout(() => {
        startCountdownLoop();
      }, 2000);
    }

    function updateLeaderboard() {
      const leaderboard = Object.entries(counts)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(" | ");
      
      const leaderboardElem = document.getElementById("leaderboard");
      leaderboardElem.style.opacity = '0.7';
      
      setTimeout(() => {
        leaderboardElem.innerText = `🏁 Leaderboard: ${leaderboard}`;
        leaderboardElem.style.opacity = '1';
      }, 100);
    }

    function displayWinner() {
      const entries = Object.entries(counts);
      const maxCount = Math.max(...entries.map(([_, count]) => count));
      const winners = entries.filter(([_, count]) => count === maxCount).map(([label]) => label.toUpperCase());

      const resultText = winners.length > 1
        ? `🤝 It's a tie between: ${winners.join(", ")} (${maxCount}/${maxImages})`
        : `🏆 WINNER: ${winners[0]} (${maxCount}/${maxImages})`;

      // Smooth winner reveal with spectacular highlight
      const winnerElem = document.getElementById("winner");
      winnerElem.style.opacity = '0';
      winnerElem.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        winnerElem.innerText = resultText;
        winnerElem.classList.add('highlight');
        winnerElem.style.opacity = '1';
        winnerElem.style.transform = 'translateY(0)';
        
        // Create floating celebration elements
        createCelebrationElements();
      }, 200);

      document.getElementById("countdown").innerText = "🎉 Game Complete!";
      
      // Smooth button appearance
      const restartBtn = document.getElementById("restart-btn");
      restartBtn.style.display = "inline-block";
      restartBtn.style.opacity = '0';
      restartBtn.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        restartBtn.style.opacity = '1';
        restartBtn.style.transform = 'translateY(0)';
      }, 600);

      // Enhanced confetti with more particles and colors
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FF69B4', '#00FFFF', '#FF6347', '#32CD32', '#9370DB']
      });

      // Multiple confetti bursts
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { x: 0.2, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
      }, 500);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { x: 0.8, y: 0.7 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
      }, 1000);

      document.getElementById("winner-sound").play().catch(() => {
        // Handle audio play restrictions gracefully
      });
    }

    function createCelebrationElements() {
      const celebration = document.createElement('div');
      celebration.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999;
      `;
      
      // Create floating emojis
      const emojis = ['🎉', '🎊', '🏆', '⭐', '✨', '🎈'];
      for (let i = 0; i < 12; i++) {
        const emoji = document.createElement('div');
        emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
        emoji.style.cssText = `
          position: absolute;
          font-size: 2rem;
          left: ${Math.random() * 100}%;
          top: 100%;
          animation: floatUp 4s ease-out forwards;
          animation-delay: ${Math.random() * 2}s;
        `;
        celebration.appendChild(emoji);
      }
      
      document.body.appendChild(celebration);
      
      // Remove celebration elements after animation
      setTimeout(() => {
        document.body.removeChild(celebration);
      }, 6000);
    }

    function restart() {
      counts = { cat: 0, dog: 0, man: 0 };
      totalImages = 0;
      
      // Remove winner highlight class
      const winnerElem = document.getElementById("winner");
      winnerElem.classList.remove('highlight');
      
      // Smooth reset animations
      const elements = ['result', 'counter', 'countdown', 'winner', 'leaderboard'];
      elements.forEach((id, index) => {
        const elem = document.getElementById(id);
        elem.style.opacity = '0.5';
        setTimeout(() => {
          elem.style.opacity = '1';
        }, index * 100);
      });
      
      document.getElementById("result").innerText = "Model restarted...";
      document.getElementById("counter").innerText = "Images counted: 0";
      document.getElementById("countdown").innerText = "⏳ Restarting...";
      document.getElementById("winner").innerText = "";
      document.getElementById("leaderboard").innerText = "🏁 Leaderboard:";
      
      const restartBtn = document.getElementById("restart-btn");
      restartBtn.style.opacity = '0';
      restartBtn.style.transform = 'translateY(20px)';
      setTimeout(() => {
        restartBtn.style.display = "none";
      }, 300);
      
      setTimeout(() => {
        startCountdownLoop();
      }, 1000);
    }

    // Add smooth transitions to dynamically updated elements
    document.addEventListener('DOMContentLoaded', () => {
      const transitionElements = ['result', 'counter', 'countdown', 'leaderboard', 'winner'];
      transitionElements.forEach(id => {
        const elem = document.getElementById(id);
        elem.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    });

    init();
