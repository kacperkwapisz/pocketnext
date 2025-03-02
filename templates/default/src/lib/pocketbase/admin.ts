import PocketBase from 'pocketbase'
import { TypedPocketBase } from './types'
import 'server-only'

let adminClient: TypedPocketBase | null = null
let lastAuthTime = 0
const AUTH_TIMEOUT = 14 * 60 * 1000 // 14 minutes (PocketBase tokens expire after 15 minutes)

export async function getAdminClient() {
    const now = Date.now()

    // Re-authenticate if the client is null or if the token is about to expire
    if (!adminClient || !adminClient.authStore.isValid || (now - lastAuthTime) > AUTH_TIMEOUT) {
        adminClient = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL) as TypedPocketBase

        // Authenticate as admin
        const email = process.env.POCKETBASE_ADMIN_EMAIL
        const password = process.env.POCKETBASE_ADMIN_PASSWORD

        if (!email || !password) {
            throw new Error('Missing admin credentials')
        }

        try {
            await adminClient.admins.authWithPassword(email, password)
            lastAuthTime = now
        } catch (error) {
            console.error('Failed to authenticate as admin:', error)
            throw new Error('Failed to authenticate as admin')
        }
    }

    return adminClient
} 