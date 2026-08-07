import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Телефон', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Введите номер телефона и пароль');
        }

        await connectToDatabase();
        const cleanPhone = credentials.phone.trim();

        const user = await User.findOne({ phone: cleanPhone });

        if (!user) {
          throw new Error('Пользователь с таким номером не найден');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isPasswordValid) {
          throw new Error('Неверный пароль');
        }

        return {
          id: user._id.toString(),
          phone: user.phone,
          role: user.role,
          name: `${user.fullName?.lastName || ''} ${user.fullName?.firstName || ''}`.trim(),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
