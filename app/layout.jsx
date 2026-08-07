import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Контроль Доступа — Шлагбаум',
  description: 'Сервис управления проездом и балансом жильцов',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
