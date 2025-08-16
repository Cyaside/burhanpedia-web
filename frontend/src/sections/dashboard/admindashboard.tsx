import React, { useEffect, useState } from "react";
import UserList from './components/UserList';
import { getApiUrl } from '@/lib/config';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER';
}

const AdminDashboard: React.FC = () => {
  const [sellers, setSellers] = useState<User[]>([]);
  const [buyers, setBuyers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl('/users'), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const users: User[] = await response.json();
        setSellers(users.filter(u => u.role === 'SELLER'));
        setBuyers(users.filter(u => u.role === 'BUYER'));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading accounts...</div>;
  }
  if (error) {
    return <div className="text-center text-red-500 py-8">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <UserList users={sellers} title="Seller Accounts" emptyText="No sellers found." />
      <UserList users={buyers} title="Buyer Accounts" emptyText="No buyers found." />
    </div>
  );
};

export default AdminDashboard;
