"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export async function cashierLoginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/pos/checkout",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/cashier/login?error=credentials");
    }

    throw error;
  }
}
