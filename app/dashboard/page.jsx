'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, startTransition, useCallback } from 'react';

import Header from '@/components/Header';
import ResidentStatusCard from '@/components/dashboard/ResidentStatusCard';
import ReceiptUploadForm from '@/components/dashboard/ReceiptUploadForm';
import ProfileEditSection from '@/components/dashboard/ProfileEditSection';
import InfoBlock from '@/components/dashboard/InfoBlock';

const qrcode = null;

const cleanValue = (val) => {
  if (!val) return '';
  const trimmed = String(val).trim();
  const lower = trimmed.toLowerCase();
  if (['нет данных', 'нет', '-', 'null', 'undefined'].includes(lower))
    return '';
  return trimmed;
};

export default function ResidentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [profileMsg, setProfileMsg] = useState('');

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (res.ok && data.user) setUserData(data.user);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      startTransition(() => {
        fetchUserProfile();
      });
    }
  }, [status, router, fetchUserProfile]);

  if (status === 'loading' || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gray-50">
        Загрузка кабинета...
      </div>
    );
  }

  const sessionUser = session?.user || {};

  const target = new Date(userData.paidUntil || 0);
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  const days = diffDays > 0 ? diffDays : 0;
  const dateStr = target.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedName =
    [
      cleanValue(userData.fullName?.lastName),
      cleanValue(userData.fullName?.firstName),
      cleanValue(userData.fullName?.middleName),
    ]
      .filter(Boolean)
      .join(' ') ||
    sessionUser.name ||
    'Житель';

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6 md:p-8 space-y-6">
        <Header
          title="Личный Кабинет Жителя"
          subtitle={`${formattedName} | Тел: ${sessionUser.phone}`}
        />

        {profileMsg && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 text-sm font-medium">
            {profileMsg}
          </div>
        )}

        <ResidentStatusCard
          status={userData.status}
          paidUntil={userData.paidUntil}
          days={days}
          dateStr={dateStr}
        />

        <ReceiptUploadForm onUploadSuccess={fetchUserProfile} />

        <ProfileEditSection
          key={userData._id}
          user={userData}
          onProfileUpdated={fetchUserProfile}
          onSuccessMessage={(msg) => setProfileMsg(msg)}
        />

        <InfoBlock qrcodeImage={qrcode} />
      </div>
    </div>
  );
}
