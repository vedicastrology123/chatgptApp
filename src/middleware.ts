import { auth } from "./lib/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Initialize locals
  context.locals.user = null;
  context.locals.session = null;

  // 2. Fetch Session
  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  }

  const { pathname } = context.url;

  // 3. PROTECT ROUTES: If trying to access app pages while NOT logged in
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/chat") || pathname.startsWith("/profile")) && !isAuthed) {
    return context.redirect("/sign-in"); // Changed from /login to match your file
  }

  // 4. PREVENT "DOUBLE LOGIN": If already logged in, don't show the sign-in page
  if (isAuthed && (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up"))) {
    return context.redirect("/chat");
  }

  return next();
});