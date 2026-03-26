import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
       google: {
        clientId: import.meta.env.GOOGLE_CLIENT_ID,
        clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
       },
  },
});