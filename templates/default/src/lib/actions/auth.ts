"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "../pocketbase/server";

export async function register(formData: FormData) {
    const client = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    try {
        await client
            .collection("users")
            .create({ email, password, passwordConfirm });
        await client.collection("users").authWithPassword(email, password);
    } catch (e) {
        // TODO: Handle error
        console.error(e);
        return;
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function login(formData: FormData) {
    const client = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
        await client.collection("users").authWithPassword(email, password);
    } catch (e) {
        // TODO: Handle error
        console.error(e);
        return;
    }

    revalidatePath("/", "layout");
    redirect("/");
}

export async function logout() {
    const client = await createClient();
    await client.authStore.clear();

    revalidatePath("/", "layout");
    redirect("/login");
}