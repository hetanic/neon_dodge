import sdk from "@farcaster/frame-sdk";
import { ROOT_URL, APP_NAME } from "./constants";

let isSDKReady = false;
let isInMiniApp = false;

/**
 * Initialize the Mini App SDK
 * Call this once when the app mounts
 */
export async function initMiniApp(): Promise<boolean> {
    try {
        // Check if we're in a Farcaster client
        const context = await sdk.context;
        isInMiniApp = !!context;

        if (isInMiniApp) {
            // Signal to the host that we're ready
            await sdk.actions.ready();
            isSDKReady = true;
        }

        return isInMiniApp;
    } catch (error) {
        console.log("Mini App SDK not available:", error);
        isInMiniApp = false;
        return false;
    }
}

/**
 * Check if running inside a Mini App environment
 */
export function isInMiniAppContext(): boolean {
    return isInMiniApp;
}

/**
 * Add the app to the user's Mini Apps
 */
export async function addToMiniApps(): Promise<boolean> {
    if (!isSDKReady) return false;

    try {
        await sdk.actions.addFrame();
        return true;
    } catch (error) {
        console.error("Failed to add Mini App:", error);
        return false;
    }
}

/**
 * Share score via Farcaster cast or fallback to clipboard
 */
export async function shareScore(score: number): Promise<{ success: boolean; method: "cast" | "clipboard" }> {
    const shareText = `🚀 I scored ${score.toLocaleString()} in ${APP_NAME}! Can you beat me?`;
    const shareUrl = ROOT_URL;

    if (isSDKReady) {
        try {
            await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(shareUrl)}`);
            return { success: true, method: "cast" };
        } catch (error) {
            console.error("Failed to compose cast:", error);
        }
    }

    // Fallback: copy to clipboard
    try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        return { success: true, method: "clipboard" };
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return { success: false, method: "clipboard" };
    }
}

/**
 * Trigger haptic feedback if available
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" = "light"): void {
    try {
        if ("vibrate" in navigator) {
            const duration = type === "light" ? 10 : type === "medium" ? 25 : 50;
            navigator.vibrate(duration);
        }
    } catch {
        // Haptics not supported
    }
}
