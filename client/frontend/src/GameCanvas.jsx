import React, { useEffect, useRef } from "react";

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const obstacleTimerRef = useRef(null);
  const coinTimerRef = useRef(null);
  const assetsRef = useRef({});
  const SERVER = "https://modi-ji.onrender.com"; 

  const stateRef = useRef({
    GAME_SPEED: 5,
    GRAVITY: 1.05,
    FLAP_FORCE: -15,
    WALL_WIDTH: 200,
    W: 0,
    H: 0,
    player: null,
    obstacles: [],
    coins: [],
    score: 0,
    gameOver: false,
  });

  // Helpers to load images and audio
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(`❌ Failed to load image: ${src}`);
      img.src = src;
    });

  const loadAudio = (src) =>
    new Promise((resolve, reject) => {
      const a = new Audio();
      a.oncanplaythrough = () => resolve(a);
      a.onerror = () => reject(`❌ Failed to load audio: ${src}`);
      a.src = src;
    });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      s.W = canvas.width;
      s.H = canvas.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawGround = () => {
      ctx.fillStyle = "#6cc174";
      ctx.fillRect(0, s.H - 40, s.W, 40);
    };

    const stopAllAudio = () => {
      Object.values(assetsRef.current).forEach((el) => {
        if (el instanceof HTMLAudioElement) {
          el.pause();
          el.currentTime = 0;
        }
      });
    };

    const spawnObstacle = () => {
      const wallHeight = Math.random() * 300 + 180;
      const inverted = Math.random() > 0.5;
      s.obstacles.push({
        x: s.W,
        y: inverted ? 0 : s.H - wallHeight - 40,
        w: s.WALL_WIDTH,
        h: wallHeight,
        inverted,
      });
    };

    const spawnCoin = () => {
      s.coins.push({
        x: s.W,
        y: Math.random() * (s.H - 200) + 80,
        w: 50,
        h: 50,
      });
    };

    // Generic collision for coins only
    const collide = (a, b) =>
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y;

    const endGame = () => {
      s.gameOver = true;
      cancelAnimationFrame(rafRef.current);
      clearInterval(obstacleTimerRef.current);
      clearInterval(coinTimerRef.current);
      stopAllAudio();
      assetsRef.current.bellSound?.play();
      setTimeout(() => assetsRef.current.gameOverSound?.play(), 300);
      document.getElementById("message").style.display = "block";
    };

    const resetGame = () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(obstacleTimerRef.current);
      clearInterval(coinTimerRef.current);
      stopAllAudio();
      s.obstacles = [];
      s.coins = [];
      s.score = 0;
      s.gameOver = false;
      s.player.y = s.H / 2;
      s.player.vy = 0;
      document.getElementById("score").innerText = 0;
      document.getElementById("message").style.display = "none";
      startGame();
    };

    const flap = () => {
      if (s.gameOver) return;
      s.player.vy = s.FLAP_FORCE;
      assetsRef.current.bgMusic?.play().catch(() => {});
    };

    const loop = () => {
      ctx.clearRect(0, 0, s.W, s.H);
      drawGround();

      if (!s.gameOver) {
        s.player.vy += s.GRAVITY;
        s.player.y += s.player.vy;
        if (s.player.y + s.player.h > s.H - 40)
          s.player.y = s.H - 40 - s.player.h;
        if (s.player.y < 0) s.player.y = 0;

        const a = assetsRef.current;
        if (a.modiImg.complete && a.modiImg.naturalWidth)
          ctx.drawImage(a.modiImg, s.player.x, s.player.y, s.player.w, s.player.h);

        // Obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const o = s.obstacles[i];
          o.x -= s.GAME_SPEED;

          // Draw Rahul wall
          if (o.inverted) {
            ctx.save();
            ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
            ctx.scale(1, -1);
            ctx.drawImage(a.rahulImg, -o.w / 2, -o.h / 2, o.w, o.h);
            ctx.restore();
          } else {
            ctx.drawImage(a.rahulImg, o.x, o.y, o.w, o.h);
          }

          // ✅ Improved natural collision
          if (o.inverted) {
            // Top wall — collide when Modi's bottom touches Rahul's head
            if (
              s.player.y <= o.y + o.h - 25 && // 25 px gap
              s.player.x + s.player.w > o.x + 15 &&
              s.player.x < o.x + o.w - 15
            ) {
              return endGame();
            }
          } else {
            // Bottom wall — collide when Modi's top touches Rahul's head
            if (
              s.player.y + s.player.h >= o.y + 25 && // 25 px from top
              s.player.x + s.player.w > o.x + 15 &&
              s.player.x < o.x + o.w - 15
            ) {
              return endGame();
            }
          }

          if (o.x + o.w < 0) s.obstacles.splice(i, 1);
        }

        // Coins
        for (let i = s.coins.length - 1; i >= 0; i--) {
          const c = s.coins[i];
          c.x -= s.GAME_SPEED;
          ctx.drawImage(a.coinImg, c.x, c.y, c.w, c.h);
          if (collide(s.player, c)) {
            s.coins.splice(i, 1);
            a.supporterSound?.play();
            s.score += 5;
            document.getElementById("score").innerText = s.score;
          } else if (c.x + c.w < 0) s.coins.splice(i, 1);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const startGame = () => {
      clearInterval(obstacleTimerRef.current);
      clearInterval(coinTimerRef.current);
      obstacleTimerRef.current = setInterval(() => !s.gameOver && spawnObstacle(), 2500);
      coinTimerRef.current = setInterval(() => !s.gameOver && spawnCoin(), 2000);
      rafRef.current = requestAnimationFrame(loop);
    };

    const onKey = (e) => {
      if (e.code === "Space") s.gameOver ? resetGame() : flap();
    };
    const onClick = () => (s.gameOver ? resetGame() : flap());
    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onClick);

    // Load all assets from backend
    (async () => {
      try {
        const [modiImg, rahulImg, coinImg, supporterSound, bgMusic, bellSound, gameOverSound] =
          await Promise.all([
            loadImage(`${SERVER}/modi.png`),
            loadImage(`${SERVER}/rahul.png`),
            loadImage(`${SERVER}/coin.png`),
            loadAudio(`${SERVER}/supporterSound.mp3`),
            loadAudio(`${SERVER}/bgMusic.mp3`),
            loadAudio(`${SERVER}/bell.mp3`),
            loadAudio(`${SERVER}/gameOver.mp3`),
          ]);

        bgMusic.loop = true;
        assetsRef.current = {
          modiImg,
          rahulImg,
          coinImg,
          supporterSound,
          bgMusic,
          bellSound,
          gameOverSound,
        };

        s.player = { x: 100, y: s.H / 2, w: 85, h: 85, vy: 0 };
        console.log("✅ All assets preloaded successfully!");
        startGame();
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", onClick);
      clearInterval(obstacleTimerRef.current);
      clearInterval(coinTimerRef.current);
      cancelAnimationFrame(rafRef.current);
      stopAllAudio();
    };
  }, []);

  return <canvas ref={canvasRef} className="canvas" />;
}
