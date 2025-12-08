// lib/auth.js
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode("Sua-Chave-Secreta-Super-Segura-123");

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(input) {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, { algorithms: ["HS256"] });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(user) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ user });

  // CORREÇÃO: Adicionado (await cookies())
  (await cookies()).set("session", session, { expires, httpOnly: true, secure: true, sameSite: "lax" });
}

export async function getSession() {
  // CORREÇÃO: Adicionado (await cookies())
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function logout() {
  // CORREÇÃO: Adicionado (await cookies())
  (await cookies()).set("session", "", { expires: new Date(0) });
}