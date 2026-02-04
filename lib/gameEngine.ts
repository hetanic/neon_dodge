import { COLORS, GAME_CONFIG, STORAGE_KEYS } from "./constants";

// Types
interface Position {
    x: number;
    y: number;
}

interface Obstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

interface Orb {
    x: number;
    y: number;
    radius: number;
    speed: number;
    pulsePhase: number;
}

interface Player {
    x: number;
    y: number;
    width: number;
    height: number;
    targetX: number;
}

export type GameStatus = "idle" | "playing" | "gameOver";

export interface GameCallbacks {
    onScoreUpdate: (score: number, bestScore: number, level: number) => void;
    onGameOver: (finalScore: number, bestScore: number) => void;
    onGameStart: () => void;
}

// Game State Class
export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private callbacks: GameCallbacks;

    private player: Player;
    private obstacles: Obstacle[] = [];
    private orbs: Orb[] = [];

    private score = 0;
    private bestScore = 0;
    private difficultyLevel = 1;
    private frameCount = 0;

    private status: GameStatus = "idle";
    private animationId: number | null = null;
    private lastTime = 0;

    private reduceMotion = false;

    constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        this.ctx = ctx;

        this.callbacks = callbacks;

        // Initialize player
        this.player = {
            x: canvas.width / 2 - GAME_CONFIG.playerWidth / 2,
            y: canvas.height - GAME_CONFIG.playerStartYOffset,
            width: GAME_CONFIG.playerWidth,
            height: GAME_CONFIG.playerHeight,
            targetX: canvas.width / 2 - GAME_CONFIG.playerWidth / 2,
        };

        // Load best score
        this.loadBestScore();

        // Check for reduced motion preference
        this.reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // Setup input handlers
        this.setupInputHandlers();
    }

    private loadBestScore(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.bestScore);
            this.bestScore = saved ? parseInt(saved, 10) : 0;
        } catch {
            this.bestScore = 0;
        }
    }

    private saveBestScore(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.bestScore, String(this.bestScore));
        } catch {
            // Ignore storage errors
        }
    }

    public resetBestScore(): void {
        this.bestScore = 0;
        try {
            localStorage.removeItem(STORAGE_KEYS.bestScore);
        } catch {
            // Ignore
        }
    }

    public getBestScore(): number {
        return this.bestScore;
    }

    public getStatus(): GameStatus {
        return this.status;
    }

    private setupInputHandlers(): void {
        // Keyboard
        const handleKeyDown = (e: KeyboardEvent) => {
            if (this.status !== "playing") return;
            const speed = GAME_CONFIG.playerSpeed * 8;
            if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
                this.player.targetX = Math.max(0, this.player.x - speed);
            } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
                this.player.targetX = Math.min(
                    this.canvas.width - this.player.width,
                    this.player.x + speed
                );
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        // Touch/Mouse
        let isDragging = false;
        let startX = 0;
        let playerStartX = 0;

        const handleStart = (clientX: number) => {
            if (this.status !== "playing") return;
            isDragging = true;
            startX = clientX;
            playerStartX = this.player.x;
        };

        const handleMove = (clientX: number) => {
            if (!isDragging || this.status !== "playing") return;
            const deltaX = clientX - startX;
            this.player.targetX = Math.max(
                0,
                Math.min(
                    this.canvas.width - this.player.width,
                    playerStartX + deltaX
                )
            );
        };

        const handleEnd = () => {
            isDragging = false;
        };

        this.canvas.addEventListener("mousedown", (e) => handleStart(e.clientX));
        this.canvas.addEventListener("mousemove", (e) => handleMove(e.clientX));
        this.canvas.addEventListener("mouseup", handleEnd);
        this.canvas.addEventListener("mouseleave", handleEnd);

        this.canvas.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handleStart(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener("touchmove", (e) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener("touchend", handleEnd);
        this.canvas.addEventListener("touchcancel", handleEnd);
    }

    public resize(width: number, height: number): void {
        this.canvas.width = width;
        this.canvas.height = height;

        // Reposition player
        this.player.y = height - GAME_CONFIG.playerStartYOffset;
        this.player.x = Math.min(this.player.x, width - this.player.width);
        this.player.targetX = this.player.x;
    }

    public start(): void {
        if (this.status === "playing") return;

        // Reset state
        this.score = 0;
        this.difficultyLevel = 1;
        this.frameCount = 0;
        this.obstacles = [];
        this.orbs = [];

        // Reset player position
        this.player.x = this.canvas.width / 2 - GAME_CONFIG.playerWidth / 2;
        this.player.targetX = this.player.x;
        this.player.y = this.canvas.height - GAME_CONFIG.playerStartYOffset;

        this.status = "playing";
        this.lastTime = performance.now();
        this.callbacks.onGameStart();

        this.loop();
    }

    public stop(): void {
        this.status = "idle";
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    private loop = (): void => {
        if (this.status !== "playing") return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.67, 2); // Normalize to ~60fps, cap at 2x
        this.lastTime = now;

        this.update(dt);
        this.render();

        this.animationId = requestAnimationFrame(this.loop);
    };

    private update(dt: number): void {
        this.frameCount++;

        // Update score
        this.score += Math.floor(GAME_CONFIG.pointsPerFrame * dt);

        // Update difficulty
        const newLevel = Math.min(
            GAME_CONFIG.maxDifficultyLevel,
            1 + Math.floor(this.frameCount / GAME_CONFIG.difficultyIncreaseInterval)
        );
        if (newLevel !== this.difficultyLevel) {
            this.difficultyLevel = newLevel;
        }

        // Update player position (smooth movement)
        const playerDx = this.player.targetX - this.player.x;
        this.player.x += playerDx * 0.3 * dt;

        // Spawn obstacles
        const spawnRate = Math.max(
            GAME_CONFIG.obstacleSpawnRateMin,
            GAME_CONFIG.obstacleBaseSpawnRate - this.difficultyLevel * 3
        );
        if (this.frameCount % Math.floor(spawnRate) === 0) {
            this.spawnObstacle();
        }

        // Spawn orbs
        if (Math.random() < GAME_CONFIG.orbSpawnChance * dt) {
            this.spawnOrb();
        }

        // Update obstacles
        const speed =
            GAME_CONFIG.obstacleBaseSpeed +
            GAME_CONFIG.obstacleSpeedIncrement * this.difficultyLevel;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += speed * dt;

            // Remove if off screen
            if (obs.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
                continue;
            }

            // Check collision
            if (this.checkCollision(this.player, obs)) {
                this.gameOver();
                return;
            }
        }

        // Update orbs
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i];
            orb.y += orb.speed * dt;
            orb.pulsePhase += 0.1 * dt;

            // Remove if off screen
            if (orb.y > this.canvas.height + orb.radius) {
                this.orbs.splice(i, 1);
                continue;
            }

            // Check collection
            if (this.checkOrbCollection(this.player, orb)) {
                this.score += GAME_CONFIG.orbPoints;
                this.orbs.splice(i, 1);
            }
        }

        // Callback for score update
        this.callbacks.onScoreUpdate(this.score, this.bestScore, this.difficultyLevel);
    }

    private spawnObstacle(): void {
        const width =
            GAME_CONFIG.obstacleMinWidth +
            Math.random() *
            (GAME_CONFIG.obstacleMaxWidth - GAME_CONFIG.obstacleMinWidth);
        const x = Math.random() * (this.canvas.width - width);

        this.obstacles.push({
            x,
            y: -GAME_CONFIG.obstacleHeight,
            width,
            height: GAME_CONFIG.obstacleHeight,
            speed:
                GAME_CONFIG.obstacleBaseSpeed +
                GAME_CONFIG.obstacleSpeedIncrement * this.difficultyLevel,
        });
    }

    private spawnOrb(): void {
        const x =
            GAME_CONFIG.orbRadius +
            Math.random() * (this.canvas.width - GAME_CONFIG.orbRadius * 2);

        this.orbs.push({
            x,
            y: -GAME_CONFIG.orbRadius,
            radius: GAME_CONFIG.orbRadius,
            speed: GAME_CONFIG.orbSpeed,
            pulsePhase: Math.random() * Math.PI * 2,
        });
    }

    private checkCollision(player: Player, obs: Obstacle): boolean {
        // Slightly shrink hitbox for fairness
        const margin = 4;
        return (
            player.x + margin < obs.x + obs.width &&
            player.x + player.width - margin > obs.x &&
            player.y + margin < obs.y + obs.height &&
            player.y + player.height - margin > obs.y
        );
    }

    private checkOrbCollection(player: Player, orb: Orb): boolean {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const dx = playerCenterX - orb.x;
        const dy = playerCenterY - orb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < orb.radius + player.width / 2;
    }

    private gameOver(): void {
        this.status = "gameOver";
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveBestScore();
        }

        this.callbacks.onGameOver(this.score, this.bestScore);
    }

    private render(): void {
        const { ctx, canvas } = this;

        // Clear with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, COLORS.background);
        gradient.addColorStop(1, COLORS.darkGray);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid lines (subtle)
        if (!this.reduceMotion) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            const gridSize = 40;
            const offset = (this.frameCount * 0.5) % gridSize;
            for (let y = offset; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        // Draw orbs
        for (const orb of this.orbs) {
            const pulseScale = this.reduceMotion ? 1 : 1 + Math.sin(orb.pulsePhase) * 0.2;
            const radius = orb.radius * pulseScale;

            // Glow effect
            const glowGradient = ctx.createRadialGradient(
                orb.x,
                orb.y,
                0,
                orb.x,
                orb.y,
                radius * 2
            );
            glowGradient.addColorStop(0, COLORS.accent);
            glowGradient.addColorStop(0.5, "rgba(255, 255, 0, 0.3)");
            glowGradient.addColorStop(1, "transparent");
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, radius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = COLORS.accent;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw obstacles
        for (const obs of this.obstacles) {
            // Glow
            ctx.shadowColor = COLORS.danger;
            ctx.shadowBlur = this.reduceMotion ? 0 : 15;

            ctx.fillStyle = COLORS.danger;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            // Inner highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
            ctx.fillRect(obs.x, obs.y, obs.width, 3);

            ctx.shadowBlur = 0;
        }

        // Draw player
        const px = this.player.x;
        const py = this.player.y;
        const pw = this.player.width;
        const ph = this.player.height;

        // Player glow
        ctx.shadowColor = COLORS.primary;
        ctx.shadowBlur = this.reduceMotion ? 0 : 20;

        // Player body (diamond shape)
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py);
        ctx.lineTo(px + pw, py + ph / 2);
        ctx.lineTo(px + pw / 2, py + ph);
        ctx.lineTo(px, py + ph / 2);
        ctx.closePath();
        ctx.fill();

        // Inner core
        ctx.fillStyle = COLORS.white;
        ctx.beginPath();
        ctx.arc(px + pw / 2, py + ph / 2, pw * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    public renderIdle(): void {
        const { ctx, canvas } = this;

        // Draw idle state
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, COLORS.background);
        gradient.addColorStop(1, COLORS.darkGray);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw player preview at center
        const px = canvas.width / 2 - GAME_CONFIG.playerWidth / 2;
        const py = canvas.height / 2;
        const pw = GAME_CONFIG.playerWidth;
        const ph = GAME_CONFIG.playerHeight;

        ctx.shadowColor = COLORS.primary;
        ctx.shadowBlur = 20;
        ctx.fillStyle = COLORS.primary;
        ctx.beginPath();
        ctx.moveTo(px + pw / 2, py);
        ctx.lineTo(px + pw, py + ph / 2);
        ctx.lineTo(px + pw / 2, py + ph);
        ctx.lineTo(px, py + ph / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
