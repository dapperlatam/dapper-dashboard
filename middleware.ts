import { NextRequest, NextResponse } from "next/server";

/**
 * Contraseña opcional para todo el sitio. Se activa solo si existen BASIC_AUTH_USER y BASIC_AUTH_PASSWORD
 * en las variables de entorno; si no, el sitio queda abierto (útil para pruebas).
 */
export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(":");
      if (decoded.slice(0, i) === user && decoded.slice(i + 1) === pass) return NextResponse.next();
    } catch {
      /* credenciales mal formadas: cae al 401 */
    }
  }
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Dapper, seguimiento de metas"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.png|logo-dapper-horizontal.*\\.png).*)"],
};
