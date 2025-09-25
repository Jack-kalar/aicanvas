'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: 0 };

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const speedRef = useRef<number>(150); // milliseconds between moves

  // Generate random food position
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    
    // Make sure food doesn't appear on snake
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );
    
    if (isOnSnake) {
      return generateFood();
    }
    
    return newFood;
  }, [snake]);

  // Reset game
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setGameStarted(false);
    setGamePaused(false);
    speedRef.current = 150;
  }, []);

  // Start game
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGamePaused(false);
    setDirection({ x: 1, y: 0 }); // Start moving right
  }, []);

  // Pause/resume game
  const togglePause = useCallback(() => {
    if (gameStarted && !gameOver) {
      setGamePaused(prev => !prev);
    }
  }, [gameStarted, gameOver]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || gameOver || gamePaused) return;

    // Prevent arrow keys from scrolling the page
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault();
    }

    // Update direction based on key pressed
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
      case ' ':
        togglePause();
        break;
    }
  }, [direction, gameStarted, gameOver, gamePaused, togglePause]);

  // Handle touch swipe
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!gameStarted || gameOver || gamePaused) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      moveEvent.preventDefault();
    };
    
    const handleTouchEnd = (endEvent: TouchEvent) => {
      if (!endEvent.changedTouches.length) return;
      
      const endTouch = endEvent.changedTouches[0];
      const endX = endTouch.clientX;
      const endY = endTouch.clientY;
      
      const diffX = endX - startX;
      const diffY = endY - startY;
      
      // Determine swipe direction based on greatest difference
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction.x === 0) {
          setDirection({ x: 1, y: 0 }); // Right
        } else if (diffX < 0 && direction.x === 0) {
          setDirection({ x: -1, y: 0 }); // Left
        }
      } else {
        // Vertical swipe
        if (diffY > 0 && direction.y === 0) {
          setDirection({ x: 0, y: 1 }); // Down
        } else if (diffY < 0 && direction.y === 0) {
          setDirection({ x: 0, y: -1 }); // Up
        }
      }
      
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }, [direction, gameStarted, gameOver, gamePaused]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameLoopRef.current) {
      window.cancelAnimationFrame(gameLoopRef.current);
    }
    
    gameLoopRef.current = window.requestAnimationFrame(gameLoop);
    
    const secondsSinceLastRender = (timestamp - lastRenderTimeRef.current) / 1000;
    if (secondsSinceLastRender < speedRef.current / 1000) return;
    
    lastRenderTimeRef.current = timestamp;
    
    if (!gameStarted || gameOver || gamePaused) return;
    
    setSnake(prevSnake => {
      // Create new snake array
      const newSnake = [...prevSnake];
      
      // Get current head position
      const head = { ...newSnake[0] };
      
      // Calculate new head position
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
      };
      
      // Check for collision with walls
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }
      
      // Check for collision with self
      if (newSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }
      
      // Add new head to snake
      newSnake.unshift(newHead);
      
      // Check if snake ate food
      if (newHead.x === food.x && newHead.y === food.y) {
        // Increase score
        const newScore = score + 10;
        setScore(newScore);
        
        // Increase speed every 50 points
        if (newScore % 50 === 0 && speedRef.current > 50) {
          speedRef.current -= 10;
        }
        
        // Generate new food
        setFood(generateFood());
      } else {
        // Remove tail if no food was eaten
        newSnake.pop();
      }
      
      return newSnake;
    });
  }, [direction, food, gameStarted, gameOver, gamePaused, generateFood, score, highScore]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size based on container
    const container = canvas.parentElement;
    if (!container) return;
    
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;
    
    // Calculate cell size
    const cellSize = size / GRID_SIZE;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }
    
    // Draw snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      
      // Head is a different color
      if (index === 0) {
        ctx.fillStyle = '#4CAF50';
      } else {
        // Gradient body color
        const colorValue = 150 - (index % 5) * 10;
        ctx.fillStyle = `rgb(76, ${175 + colorValue}, 80)`;
      }
      
      // Draw rounded segments
      ctx.beginPath();
      // Fallback for browsers that don't support roundRect
      if (ctx.roundRect) {
        ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 5);
      } else {
        ctx.rect(x + 1, y + 1, cellSize - 2, cellSize - 2);
      }
      ctx.fill();
      
      // Add eyes to head
      if (index === 0) {
        ctx.fillStyle = '#000';
        const eyeSize = cellSize / 5;
        
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        if (direction.x === 1) { // Right
          leftEyeX = x + cellSize - eyeSize * 2;
          leftEyeY = y + eyeSize * 2;
          rightEyeX = x + cellSize - eyeSize * 2;
          rightEyeY = y + cellSize - eyeSize * 3;
        } else if (direction.x === -1) { // Left
          leftEyeX = x + eyeSize;
          leftEyeY = y + eyeSize * 2;
          rightEyeX = x + eyeSize;
          rightEyeY = y + cellSize - eyeSize * 3;
        } else if (direction.y === 1) { // Down
          leftEyeX = x + eyeSize * 2;
          leftEyeY = y + cellSize - eyeSize * 2;
          rightEyeX = x + cellSize - eyeSize * 3;
          rightEyeY = y + cellSize - eyeSize * 2;
        } else { // Up
          leftEyeX = x + eyeSize * 2;
          leftEyeY = y + eyeSize;
          rightEyeX = x + cellSize - eyeSize * 3;
          rightEyeY = y + eyeSize;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw food
    const foodX = food.x * cellSize;
    const foodY = food.y * cellSize;
    
    // Pulsing effect
    const pulseSize = Math.sin(Date.now() / 200) * 2;
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.arc(
      foodX + cellSize / 2, 
      foodY + cellSize / 2, 
      cellSize / 2 - 2 + pulseSize, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw shine effect on food
    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.arc(
      foodX + cellSize / 3, 
      foodY + cellSize / 3, 
      cellSize / 6, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
  }, [snake, food, direction]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleKeyDown, handleTouchStart]);

  // Set up game loop
  useEffect(() => {
    gameLoopRef.current = window.requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        window.cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  // Set up drawing loop
  useEffect(() => {
    const drawInterval = setInterval(draw, 100);
    return () => clearInterval(drawInterval);
  }, [draw]);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Save high score to localStorage
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  return (
    <div className="snake-game-container">
      <div className="game-header">
        <div className="score-container">
          <div className="score">Score: {score}</div>
          <div className="high-score">High Score: {highScore}</div>
        </div>
        <div className="game-controls">
          {!gameStarted ? (
            <button className="game-button start-button" onClick={startGame}>
              Start Game
            </button>
          ) : (
            <>
              <button className="game-button pause-button" onClick={togglePause}>
                {gamePaused ? 'Resume' : 'Pause'}
              </button>
              <button className="game-button reset-button" onClick={resetGame}>
                Reset
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="game-board">
        <canvas 
          ref={canvasRef} 
          className="game-canvas"
        />
        
        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-content">
              <h2>Game Over!</h2>
              <p>Your score: {score}</p>
              <button className="game-button restart-button" onClick={resetGame}>
                Play Again
              </button>
            </div>
          </div>
        )}
        
        {!gameStarted && !gameOver && (
          <div className="start-overlay">
            <div className="start-content">
              <h2>Snake Game</h2>
              <p>Use WASD or Arrow Keys to control the snake</p>
              <p>Swipe on mobile devices to control</p>
              <button className="game-button start-button" onClick={startGame}>
                Start Game
              </button>
            </div>
          </div>
        )}
        
        {gamePaused && gameStarted && !gameOver && (
          <div className="pause-overlay">
            <div className="pause-content">
              <h2>Game Paused</h2>
              <button className="game-button resume-button" onClick={togglePause}>
                Resume
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="game-instructions">
        <div className="instructions">
          <p>Controls: WASD or Arrow Keys</p>
          <p>Mobile: Swipe to change direction</p>
          <p>Space: Pause/Resume</p>
        </div>
      </div>
      
      <style jsx global>{`
        .snake-game-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          max-width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
        }
        
        .score-container {
          display: flex;
          gap: 20px;
        }
        
        .score, .high-score {
          font-size: 1.2rem;
          font-weight: bold;
        }
        
        .game-controls {
          display: flex;
          gap: 10px;
        }
        
        .game-button {
          padding: 10px 20px;
          border: none;
          border-radius: 30px;
          background: linear-gradient(to right, #4CAF50, #8BC34A);
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .game-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        
        .game-button:active {
          transform: translateY(0);
        }
        
        .pause-button {
          background: linear-gradient(to right, #2196F3, #21CBF3);
        }
        
        .reset-button {
          background: linear-gradient(to right, #FF9800, #FFC107);
        }
        
        .restart-button {
          background: linear-gradient(to right, #F44336, #FF9800);
        }
        
        .game-board {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          padding: 20px;
        }
        
        .game-canvas {
          background-color: #f0f0f0;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          max-width: 100%;
          max-height: 100%;
        }
        
        .game-over-overlay, .start-overlay, .pause-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 10px;
        }
        
        .game-over-content, .start-content, .pause-content {
          text-align: center;
          color: white;
          padding: 30px;
          background: rgba(30, 30, 40, 0.9);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          max-width: 80%;
        }
        
        .game-over-content h2, .start-content h2, .pause-content h2 {
          margin-top: 0;
          font-size: 2.5rem;
          color: #FF5252;
        }
        
        .game-over-content p, .start-content p {
          font-size: 1.2rem;
          margin: 10px 0;
        }
        
        .game-instructions {
          padding: 15px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          text-align: center;
        }
        
        .instructions {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .instructions p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .game-header {
            flex-direction: column;
            gap: 10px;
            padding: 10px;
          }
          
          .score-container {
            gap: 15px;
          }
          
          .score, .high-score {
            font-size: 1rem;
          }
          
          .game-controls {
            gap: 8px;
          }
          
          .game-button {
            padding: 8px 15px;
            font-size: 0.9rem;
          }
          
          .game-board {
            padding: 10px;
          }
          
          .game-over-content h2, .start-content h2, .pause-content h2 {
            font-size: 2rem;
          }
          
          .game-over-content p, .start-content p {
            font-size: 1rem;
          }
          
          .instructions {
            gap: 10px;
          }
          
          .instructions p {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SnakeGame;