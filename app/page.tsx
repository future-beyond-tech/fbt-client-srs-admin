import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_KEY } from "@/lib/constants";

export default function Home() {
  const token = cookies().get(AUTH_COOKIE_KEY)?.value;

  if (token) {
    redirect("/dashboard");
  }

  redirect("/login");
}
