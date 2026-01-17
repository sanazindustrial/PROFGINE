import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const directAuth = cookieStore.get('direct-auth');

        if (!directAuth?.value) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const user = JSON.parse(atob(directAuth.value));
        return NextResponse.json({ user });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({ user: null }, { status: 401 });
    }
}

export async function DELETE() {
    try {
        const response = NextResponse.json({ success: true });
        response.cookies.set('direct-auth', '', {
            path: '/',
            expires: new Date(0),
            httpOnly: false
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }
}