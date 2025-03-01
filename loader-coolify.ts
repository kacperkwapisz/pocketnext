'use client'

import { getURL } from "@/lib/utils"

interface ImageLoaderProps {
    src: string
    width?: number
    quality?: number
}

export default function LoaderCoolify({ src, width, quality }: ImageLoaderProps): string {
    const isLocal = !src.startsWith('http')
    const query = new URLSearchParams()

    const imageOptimizationApi = 'https://images.coollabs.io/o'

    const fullSrc = `${getURL()}${src}`

    if (width) query.set('width', width.toString())
    if (quality) query.set('quality', quality.toString())

    if (isLocal && process.env.NODE_ENV === 'development') {
        return src
    }
    if (isLocal) {
        return `${imageOptimizationApi}/${fullSrc}?${query.toString()}`
    }
    return `${imageOptimizationApi}/${src}?${query.toString()}`
}