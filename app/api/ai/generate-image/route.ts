/**
 * AI Image Generation API (Nano Banana / Gamma AI style)
 * POST /api/ai/generate-image - Generate educational visuals
 */

import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { aiQualityService } from "@/lib/services/ai-quality.service"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
    try {
        const session = await requireSession()

        const body = await req.json()
        const {
            description,
            context,
            style = 'academic',
            mode = 'single', // 'single' | 'slides'
            slides,
            topic,
        } = body

        if (!description && mode === 'single') {
            return NextResponse.json(
                { error: "description is required" },
                { status: 400 }
            )
        }

        if (mode === 'slides' && (!slides || !Array.isArray(slides))) {
            return NextResponse.json(
                { error: "slides array is required for slides mode" },
                { status: 400 }
            )
        }

        // Validate style
        const validStyles = ['academic', 'infographic', 'diagram', 'photo-realistic', 'illustration']
        if (!validStyles.includes(style)) {
            return NextResponse.json(
                { error: `Invalid style. Must be one of: ${validStyles.join(', ')}` },
                { status: 400 }
            )
        }

        if (mode === 'slides') {
            // Generate images for multiple slides
            const results = await aiQualityService.generateSlideImages(
                slides,
                topic || 'Educational content',
                style
            )

            return NextResponse.json({
                mode: 'slides',
                results,
                generatedBy: 'nano-banana',
                user: session.user.email,
            })
        }

        // Single image generation
        const result = await aiQualityService.generateImage(
            description,
            context || '',
            style
        )

        return NextResponse.json({
            mode: 'single',
            image: result,
            generatedBy: 'nano-banana',
            user: session.user.email,
        })
    } catch (err: unknown) {
        const error = err as Error
        if (error?.message === "Not authenticated") {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }
        console.error("[POST /api/ai/generate-image]", error)
        return NextResponse.json(
            { error: "Image generation failed" },
            { status: 500 }
        )
    }
}
