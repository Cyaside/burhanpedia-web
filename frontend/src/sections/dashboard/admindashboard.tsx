import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      } catch (err: any) {
        setError(err.message || 'Unknown error');
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
      <Card>
        <CardHeader>
          <CardTitle>Seller Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <div className="text-gray-500">No sellers found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sellers.map((seller) => (
                <Card key={seller.id} className="bg-secondary">
                  <CardHeader>
                    <CardTitle>{seller.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Email: {seller.email}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Buyer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {buyers.length === 0 ? (
            <div className="text-gray-500">No buyers found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyers.map((buyer) => (
                <Card key={buyer.id} className="bg-secondary">
                  <CardHeader>
                    <CardTitle>{buyer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Email: {buyer.email}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
