"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GameEngine, GameStatus } from "@/lib/gameEngine";
import { initMiniApp, shareScore, addToMiniApps, isInMiniAppContext, triggerHaptic } from "@/lib/miniapp";
import { STORAGE_KEYS, COLORS, APP_NAME } from "@/lib/constants";
import SettingsModal from "./SettingsModal";

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    const [status, setStatus] = useState<GameStatus>("idle");
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [finalScore, setFinalScore] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [inMiniApp, setInMiniApp] = useState(false);
    const [hapticsEnabled, setHapticsEnabled] = useState(true);

    // Initialize
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // Set initial size
        const resize = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            engineRef.current?.resize(rect.width, rect.height);
            engineRef.current?.renderIdle();
        };

        resize();
        window.addEventListener("resize", resize);

        // Create engine
        const engine = new GameEngine(canvas, {
            onScoreUpdate: (s, b, l) => {
                setScore(s);
                setBestScore(b);
                setLevel(l);
            },
            onGameOver: (final, best) => {
                setFinalScore(final);
                setBestScore(best);
                setStatus("gameOver");
                if (hapticsEnabled) triggerHaptic("heavy");
            },
            onGameStart: () => {
                setStatus("playing");
            },
        });
        engineRef.current = engine;
        setBestScore(engine.getBestScore());
        engine.renderIdle();

        // Init Mini App SDK
        initMiniApp().then(setInMiniApp);

        // Load haptics setting
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.hapticsEnabled);
            if (saved !== null) setHapticsEnabled(saved === "true");
        } catch {
            // Ignore
        }

        return () => {
            window.removeEventListener("resize", resize);
            engine.stop();
        };
    }, [hapticsEnabled]);

    const handleStart = useCallback(() => {
        engineRef.current?.start();
        if (hapticsEnabled) triggerHaptic("light");
    }, [hapticsEnabled]);

    const handleRestart = useCallback(() => {
        setStatus("idle");
        setTimeout(() => {
            engineRef.current?.start();
            if (hapticsEnabled) triggerHaptic("light");
        }, 100);
    }, [hapticsEnabled]);

    const handleShare = useCallback(async () => {
        const result = await shareScore(finalScore);
        if (result.success) {
            setToastMessage(
                result.method === "cast"
                    ? "Opening Warpcast..."
                    : "Score copied to clipboard!"
            );
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
        }
    }, [finalScore]);

    const handleAddMiniApp = useCallback(async () => {
        const success = await addToMiniApps();
        if (success) {
            setToastMessage("Added to your Mini Apps!");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
        }
    }, []);

    const handleResetBestScore = useCallback(() => {
        engineRef.current?.resetBestScore();
        setBestScore(0);
        setToastMessage("Best score reset!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    }, []);

    const toggleHaptics = useCallback((enabled: boolean) => {
        setHapticsEnabled(enabled);
        try {
            localStorage.setItem(STORAGE_KEYS.hapticsEnabled, String(enabled));
        } catch {
            // Ignore
        }
    }, []);

    return (
        <div
            ref={containerRef}
            className="game-container"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                touchAction: "none",
                userSelect: "none",
                backgroundColor: COLORS.background,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                }}
            />

            {/* HUD - Always visible during gameplay */}
            {status === "playing" && (
                <div className="hud">
                    <div className="hud-item">
                        <span className="hud-label">SCORE</span>
                        <span className="hud-value">{score.toLocaleString()}</span>
                    </div>
                    <div className="hud-item">
                        <span className="hud-label">BEST</span>
                        <span className="hud-value best">{bestScore.toLocaleString()}</span>
                    </div>
                    <div className="hud-item">
                        <span className="hud-label">LEVEL</span>
                        <span className="hud-value level">{level}</span>
                    </div>
                </div>
            )}

            {/* Settings Button - Always visible */}
            <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
                aria-label="Settings"
            >
                ⚙️
            </button>

            {/* Start Screen */}
            {status === "idle" && (
                <div className="overlay">
                    <div className="start-screen">
                        <h1 className="title">{APP_NAME}</h1>
                        <p className="subtitle">Dodge. Survive. Score.</p>

                        {bestScore > 0 && (
                            <p className="best-score-display">
                                Best Score: {bestScore.toLocaleString()}
                            </p>
                        )}

                        <button className="start-btn" onClick={handleStart}>
                            TAP TO START
                        </button>

                        <div className="instructions">
                            <p>📱 Drag to move</p>
                            <p>⌨️ Arrow keys / A-D</p>
                            <p>⭐ Collect orbs for bonus points</p>
                        </div>

                        {inMiniApp && (
                            <button className="add-btn" onClick={handleAddMiniApp}>
                                ➕ Add to Mini Apps
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {status === "gameOver" && (
                <div className="overlay">
                    <div className="game-over-screen">
                        <h2 className="game-over-title">GAME OVER</h2>

                        <div className="final-score">
                            <span className="final-score-label">SCORE</span>
                            <span className="final-score-value">{finalScore.toLocaleString()}</span>
                        </div>

                        {finalScore >= bestScore && finalScore > 0 && (
                            <p className="new-best">🎉 NEW BEST!</p>
                        )}

                        <div className="game-over-buttons">
                            <button className="play-again-btn" onClick={handleRestart}>
                                PLAY AGAIN
                            </button>

                            <button className="share-btn" onClick={handleShare}>
                                📤 SHARE SCORE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    onClose={() => setShowSettings(false)}
                    hapticsEnabled={hapticsEnabled}
                    onToggleHaptics={toggleHaptics}
                    onResetBestScore={handleResetBestScore}
                />
            )}

            {/* Toast */}
            {showToast && (
                <div className="toast">
                    {toastMessage}
                </div>
            )}

            <style jsx>{`
        .hud {
          position: absolute;
          top: env(safe-area-inset-top, 16px);
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          padding: 16px;
          pointer-events: none;
        }

        .hud-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hud-label {
          font-size: 10px;
          letter-spacing: 2px;
          color: rgba(255, 255, 255, 0.6);
        }

        .hud-value {
          font-size: 24px;
          font-weight: bold;
          color: ${COLORS.white};
        }

        .hud-value.best {
          color: ${COLORS.accent};
        }

        .hud-value.level {
          color: ${COLORS.secondary};
        }

        .settings-btn {
          position: absolute;
          top: calc(env(safe-area-inset-top, 16px) + 8px);
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          font-size: 20px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .settings-btn:hover {
          transform: scale(1.1);
        }

        .overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(10px);
        }

        .start-screen,
        .game-over-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
          text-align: center;
        }

        .title {
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary});
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          text-shadow: 0 0 40px ${COLORS.primary};
        }

        .subtitle {
          font-size: 16px;
          color: ${COLORS.white};
          opacity: 0.8;
          margin-bottom: 24px;
        }

        .best-score-display {
          font-size: 14px;
          color: ${COLORS.accent};
          margin-bottom: 24px;
        }

        .start-btn {
          padding: 20px 48px;
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 2px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success});
          color: ${COLORS.background};
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 30px ${COLORS.primary}80;
        }

        .start-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 0 50px ${COLORS.primary};
        }

        .instructions {
          margin-top: 32px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .instructions p {
          margin: 8px 0;
        }

        .add-btn {
          margin-top: 24px;
          padding: 12px 24px;
          font-size: 14px;
          border: 2px solid ${COLORS.secondary};
          border-radius: 8px;
          background: transparent;
          color: ${COLORS.secondary};
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-btn:hover {
          background: ${COLORS.secondary};
          color: ${COLORS.background};
        }

        .game-over-title {
          font-size: 36px;
          font-weight: 900;
          color: ${COLORS.danger};
          margin-bottom: 24px;
          text-shadow: 0 0 20px ${COLORS.danger};
        }

        .final-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 16px;
        }

        .final-score-label {
          font-size: 12px;
          letter-spacing: 3px;
          color: rgba(255, 255, 255, 0.6);
        }

        .final-score-value {
          font-size: 64px;
          font-weight: 900;
          color: ${COLORS.white};
        }

        .new-best {
          font-size: 18px;
          color: ${COLORS.accent};
          margin-bottom: 24px;
          animation: pulse 1s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .game-over-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 280px;
        }

        .play-again-btn {
          padding: 18px 36px;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.success});
          color: ${COLORS.background};
          cursor: pointer;
          transition: transform 0.2s;
        }

        .play-again-btn:hover {
          transform: scale(1.05);
        }

        .share-btn {
          padding: 16px 32px;
          font-size: 14px;
          font-weight: bold;
          border: 2px solid ${COLORS.accent};
          border-radius: 12px;
          background: transparent;
          color: ${COLORS.accent};
          cursor: pointer;
          transition: all 0.2s;
        }

        .share-btn:hover {
          background: ${COLORS.accent};
          color: ${COLORS.background};
        }

        .toast {
          position: absolute;
          bottom: calc(env(safe-area-inset-bottom, 20px) + 20px);
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          background: ${COLORS.mediumGray};
          color: ${COLORS.white};
          border-radius: 8px;
          font-size: 14px;
          animation: fadeInUp 0.3s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
        </div>
    );
}
