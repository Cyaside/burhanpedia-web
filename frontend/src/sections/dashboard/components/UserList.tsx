import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'BUYER' | 'SELLER';
}

interface UserListProps {
  users: User[];
  title: string;
  emptyText: string;
}

const UserList: React.FC<UserListProps> = ({ users, title, emptyText }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {users.length === 0 ? (
        <div className="text-gray-500">{emptyText}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="bg-secondary">
              <CardHeader>
                <CardTitle>{user.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Email: {user.email}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default UserList;
