import { redirect } from "next/navigation";

export default function DevLoginPage() {
    redirect("/auth/signin");
}