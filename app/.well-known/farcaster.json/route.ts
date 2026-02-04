import { NextResponse } from "next/server";
import {
    APP_NAME,
    APP_TAGLINE,
    APP_SUBTITLE,
    APP_DESCRIPTION,
    APP_TAGS,
    APP_CATEGORY,
    ROOT_URL,
} from "@/lib/constants";

export async function GET() {
    const manifest = {
        // Account Association - PLACEHOLDER: Replace with signed values from Base Build
        accountAssociation: {
            header: "PLACEHOLDER_HEADER",
            payload: "PLACEHOLDER_PAYLOAD",
            signature: "PLACEHOLDER_SIGNATURE",
        },

        // Mini App Configuration
        miniapp: {
            version: "1",
            name: APP_NAME,
            subtitle: APP_SUBTITLE,
            description: APP_DESCRIPTION,
            tagline: APP_TAGLINE,
            homeUrl: ROOT_URL,
            iconUrl: `${ROOT_URL}/assets/icon.png`,
            splashImageUrl: `${ROOT_URL}/assets/splash.png`,
            splashBackgroundColor: "#0a0a0f",
            heroImageUrl: `${ROOT_URL}/assets/hero.png`,
            screenshotUrls: [
                `${ROOT_URL}/assets/screenshot-1.png`,
            ],
            primaryCategory: APP_CATEGORY,
            tags: APP_TAGS,
            ogTitle: `${APP_NAME} - ${APP_TAGLINE}`,
            ogDescription: APP_DESCRIPTION,
            ogImageUrl: `${ROOT_URL}/assets/hero.png`,
            // Set noindex to true while testing, remove for production
            noindex: true,
        },
    };

    return NextResponse.json(manifest, {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300",
        },
    });
}
