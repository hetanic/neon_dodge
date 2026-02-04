// App Metadata
export const APP_NAME = "NEON DODGE";
export const APP_TAGLINE = "Dodge. Survive. Score.";
export const APP_SUBTITLE = "Endless Arcade Game";
export const APP_DESCRIPTION =
  "A fast-paced endless dodger game. Swipe to avoid neon obstacles, collect orbs for bonus points, and compete for the highest score. How long can you survive?";
export const APP_TAGS = ["game", "arcade", "endless", "dodge", "reflex"];
export const APP_CATEGORY = "games";

// URL - uses env var in production, fallback for dev
export const ROOT_URL =
  (process.env.NEXT_PUBLIC_URL || "http://localhost:3000").replace(/\/$/, "");

// Colors
export const COLORS = {
  background: "#0a0a0f",
  primary: "#00ffff", // Cyan neon
  secondary: "#ff00ff", // Magenta neon
  accent: "#ffff00", // Yellow neon
  danger: "#ff3366", // Red-pink
  success: "#00ff88", // Green neon
  white: "#ffffff",
  darkGray: "#1a1a2e",
  mediumGray: "#2a2a4e",
} as const;

// Game Configuration
export const GAME_CONFIG = {
  // Player
  playerWidth: 40,
  playerHeight: 40,
  playerSpeed: 8,
  playerStartYOffset: 100, // From bottom

  // Obstacles
  obstacleMinWidth: 30,
  obstacleMaxWidth: 80,
  obstacleHeight: 20,
  obstacleBaseSpeed: 3,
  obstacleSpeedIncrement: 0.15,
  obstacleBaseSpawnRate: 60, // frames between spawns
  obstacleSpawnRateMin: 15,

  // Orbs
  orbRadius: 15,
  orbSpawnChance: 0.02, // 2% chance per frame
  orbSpeed: 2,
  orbPoints: 20,

  // Difficulty
  difficultyIncreaseInterval: 500, // frames
  maxDifficultyLevel: 20,

  // Scoring
  pointsPerFrame: 0.017, // ~1 point per second at 60fps
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  bestScore: "neondodge_best_score",
  soundEnabled: "neondodge_sound",
  hapticsEnabled: "neondodge_haptics",
} as const;
