import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";
import { Session, User } from "next-auth";

const prisma = new PrismaClient()

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          fiscalRegime: user.fiscalRegime,
          siret: user.siret,
          tvaNumber: user.tvaNumber,
          address: user.address,
          legalStatus: user.legalStatus,
          rcsNumber: user.rcsNumber,
          shareCapital: user.shareCapital,
          apeCode: user.apeCode,
          stripeAccountId: user.stripeAccountId,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        const extendedUser = user as User & {
          fiscalRegime?: string;
          siret?: string;
          tvaNumber?: string;
          address?: string;
          legalStatus?: string;
          rcsNumber?: string;
          shareCapital?: string;
          apeCode?: string;
          stripeAccountId?: string;
          microEntrepreneurType?: string;
          declarationFrequency?: string;
        };
        token.id = extendedUser.id;
        token.fiscalRegime = extendedUser.fiscalRegime;
        token.siret = extendedUser.siret;
        token.tvaNumber = extendedUser.tvaNumber;
        token.address = extendedUser.address;
        token.legalStatus = extendedUser.legalStatus;
        token.rcsNumber = extendedUser.rcsNumber;
        token.shareCapital = extendedUser.shareCapital;
        token.apeCode = extendedUser.apeCode;
        token.stripeAccountId = extendedUser.stripeAccountId;
        token.microEntrepreneurType = extendedUser.microEntrepreneurType;
        token.declarationFrequency = extendedUser.declarationFrequency;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.fiscalRegime = token.fiscalRegime;
        session.user.siret = token.siret;
        session.user.tvaNumber = token.tvaNumber;
        session.user.address = token.address;
        session.user.legalStatus = token.legalStatus;
        session.user.rcsNumber = token.rcsNumber;
        session.user.shareCapital = token.shareCapital;
        session.user.apeCode = token.apeCode;
        session.user.stripeAccountId = token.stripeAccountId;
        session.user.microEntrepreneurType = token.microEntrepreneurType;
        session.user.declarationFrequency = token.declarationFrequency;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
}