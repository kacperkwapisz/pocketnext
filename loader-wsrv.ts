'use client'

import { getURL } from "@/lib/utils"

interface ImageLoaderProps {
    src: string
    width?: number
    quality?: number
}

export default function LoaderWsrv({ src, width, quality }: ImageLoaderProps): string {
    const isLocal = !src.startsWith('http')
    const query = new URLSearchParams()

    const imageOptimizationApi = 'https://wsrv.nl'

    const fullSrc = `${getURL()}${src}`

    if (width) query.set('w', width.toString())
    if (quality) query.set('q', quality.toString())

    if (isLocal && process.env.NODE_ENV === 'development') {
        return src
    }
    if (isLocal) {
        query.set('url', fullSrc)
        return `${imageOptimizationApi}?${query.toString()}`
    }
    query.set('url', src)
    return `${imageOptimizationApi}?${query.toString()}`
}