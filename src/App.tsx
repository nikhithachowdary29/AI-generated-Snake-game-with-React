/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

const TRACKS = [
  { id: 1, title: "SYS.AUDIO.01 // NEON_PULSE", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "SYS.AUDIO.02 // CYBER_DRIFT", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "SYS.AUDIO.03 // DATA_HORIZON", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function App() {
  // --- Snake Game State ---
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [dir, setDir] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const dirRef = useRef(dir);
  const lastProcessedDirRef = useRef(dir);
  const foodRef = useRef(food);

  // --- Music Player State ---
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync refs
  useEffect(() => { dirRef.current = dir; }, [dir]);
  useEffect(() => { foodRef.current = food; }, [food]);

  // Update high score
  useEffect(() => {
    if (gameOver) {
      setHighScore(prev => Math.max(prev, score));
    }
  }, [gameOver, score]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game controls
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (!isGameStarted && e.key === ' ') {
        setIsGameStarted(true);
        return;
      }

      const lastDir = lastProcessedDirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (lastDir.y !== 1) setDir({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (lastDir.y !== -1) setDir({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (lastDir.x !== 1) setDir({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (lastDir.x !== -1) setDir({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted]);

  // Game Loop
  useEffect(() => {
    if (!isGameStarted || gameOver) return;

    const moveSnake = () => {
      setSnake((prev) => {
        const head = prev[0];
        const currentDir = dirRef.current;
        lastProcessedDirRef.current = currentDir;

        const newHead = { x: head.x + currentDir.x, y: head.y + currentDir.y };

        // Wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prev;
        }

        // Self collision
        if (prev.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];
        const currentFood = foodRef.current;

        // Food collision
        if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
          setScore((s) => s + 10);
          
          // Generate new food
          let newFood;
          while (true) {
            newFood = {
              x: Math.floor(Math.random() * GRID_SIZE),
              y: Math.floor(Math.random() * GRID_SIZE),
            };
            // Ensure food doesn't spawn on snake
            if (!newSnake.some((s) => s.x === newFood.x && s.y === newFood.y)) {
              break;
            }
          }
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, 100);
    return () => clearInterval(interval);
  }, [isGameStarted, gameOver]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDir(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsGameStarted(true);
    setFood({ x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) });
  };

  // --- Music Player Logic ---
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [currentTrackIdx, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIdx((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-4 md:p-8 font-pixel text-[#00ffff] crt-flicker selection:bg-[#ff00ff] selection:text-black">
      <div className="scanlines" />
      
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b-4 border-[#ff00ff] pb-4 z-10 tear">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold glitch" data-text="SNAKE.EXE">
            SNAKE.EXE
          </h1>
          <p className="text-[#ff00ff] text-xl md:text-2xl mt-2 tracking-widest">
            {">>"} SYSTEM_OVERRIDE_ACTIVE
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end text-2xl md:text-3xl mt-4 md:mt-0">
          <div className="text-[#00ffff]">
            FRAGMENTS: {score.toString().padStart(4, '0')}
          </div>
          <div className="text-[#ff00ff]">
            MAX_FRAGMENTS: {highScore.toString().padStart(4, '0')}
          </div>
        </div>
      </header>

      {/* Game Board */}
      <main className="relative flex-1 flex items-center justify-center w-full max-w-2xl my-auto z-10 tear">
        <div
          className="relative bg-black border-4 border-[#00ffff] shadow-[0_0_20px_#00ffff] overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '1 / 1',
          }}
        >
          {/* Grid Cells */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnake = snake.some(s => s.x === x && s.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`
                  relative border border-[#00ffff]/20
                  ${isHead ? 'bg-white shadow-[0_0_15px_#ffffff] z-10' : ''}
                  ${isSnake && !isHead ? 'bg-[#00ffff] shadow-[0_0_5px_#00ffff]' : ''}
                  ${isFood ? 'bg-[#ff00ff] shadow-[0_0_15px_#ff00ff] animate-pulse' : ''}
                `}
              />
            );
          })}
        </div>

        {/* Overlays */}
        {!isGameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 border-4 border-[#ff00ff]">
            <button
              onClick={() => setIsGameStarted(true)}
              className="px-6 py-4 bg-[#00ffff] text-black text-2xl md:text-4xl font-bold hover:bg-[#ff00ff] hover:text-white transition-colors uppercase glitch"
              data-text="INITIATE_SEQUENCE"
            >
              INITIATE_SEQUENCE
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 border-4 border-[#ff00ff]">
            <h2 className="text-5xl md:text-7xl font-bold text-[#ff00ff] mb-4 glitch" data-text="FATAL_ERROR">
              FATAL_ERROR
            </h2>
            <p className="text-2xl md:text-3xl text-[#00ffff] mb-8">DATA_CORRUPTED: {score}</p>
            <button
              onClick={resetGame}
              className="px-6 py-3 border-4 border-[#00ffff] text-[#00ffff] text-2xl md:text-4xl font-bold hover:bg-[#00ffff] hover:text-black transition-colors uppercase"
            >
              [ EXECUTE_REBOOT ]
            </button>
          </div>
        )}
      </main>

      {/* Music Player */}
      <footer className="w-full max-w-4xl mt-8 bg-black border-4 border-[#ff00ff] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-10 shadow-[0_0_20px_#ff00ff] tear">
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <div className={`w-12 h-12 border-4 border-[#00ffff] flex items-center justify-center ${isPlaying ? 'bg-[#00ffff] text-black' : 'text-[#00ffff]'}`}>
            <span className="text-3xl font-bold mt-1">♪</span>
          </div>
          <div className="overflow-hidden">
            <h3 className="text-xl md:text-2xl font-bold text-[#00ffff] truncate">
              {TRACKS[currentTrackIdx].title}
            </h3>
            <p className="text-lg md:text-xl text-[#ff00ff] truncate">
              STATUS: {isPlaying ? 'TRANSMITTING' : 'IDLE'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-8 text-3xl md:text-5xl">
          <button onClick={prevTrack} className="text-[#00ffff] hover:text-[#ff00ff] hover:scale-110 transition-transform">
            [{"<<"}]
          </button>
          <button
            onClick={togglePlay}
            className="text-[#ff00ff] hover:text-[#00ffff] hover:scale-110 transition-transform font-bold"
          >
            {isPlaying ? '[||]' : '[ >]'}
          </button>
          <button onClick={nextTrack} className="text-[#00ffff] hover:text-[#ff00ff] hover:scale-110 transition-transform">
            [{">>"}]
          </button>
        </div>

        <div className="w-full md:w-1/3 flex justify-end items-center gap-4 text-[#00ffff] text-2xl">
          <span>VOL:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 md:w-32 h-4 bg-black border-2 border-[#00ffff] appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #00ffff ${volume * 100}%, #000 ${volume * 100}%)`
            }}
          />
        </div>

        <audio
          ref={audioRef}
          src={TRACKS[currentTrackIdx].url}
          onEnded={nextTrack}
          loop={false}
        />
      </footer>
    </div>
  );
}
