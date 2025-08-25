'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/config';
import AdminDashboard from '@/sections/dashboard/admindashboard';
import SellerDashboard from '@/sections/dashboard/sellerdashboard';
import BuyerDashboard from '@/sections/dashboard/buyerdashboard';



interface Coupon {
  id: number;
  code: string;
  discount: string;
  expiry: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  profileImage?: string;
  balance?: number;
  coupons?: Coupon[];
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch(getApiUrl('/auth/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [router, fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-red-600 bg-red-100';
      case 'SELLER':
        return 'text-blue-600 bg-blue-100';
      case 'BUYER':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  let dashboardContent;
  if (user.role === 'ADMIN') {
    dashboardContent = <AdminDashboard />;
  } else if (user.role === 'SELLER') {
    dashboardContent = <SellerDashboard />;
  } else if (user.role === 'BUYER') {
    // Mock data Karena belum jadi
    const balance = typeof user.balance === 'number' ? user.balance : 250000;
    const coupons = user.coupons ?? [
      {
        id: 1,
        code: 'WWODKDNADJD',
        discount: '10% Off',
        expiry: '2025-12-31',
      },
      {
        id: 2,
        code: 'QOSIDHSNAD',
        discount: '32% off',
        expiry: '2025-09-30',
      },
    ];
    dashboardContent = (
      <BuyerDashboard
        name={user.name}
        email={user.email}
        profileImage={user.profileImage}
        balance={balance}
        coupons={coupons}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          {dashboardContent}
        </div>
      </div>
    </div>
  );
}
