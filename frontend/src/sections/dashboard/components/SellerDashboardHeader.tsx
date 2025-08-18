import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const SellerDashboardHeader: React.FC = () => (
  <Card className="mb-8 shadow-lg border-2 border-green-200">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-2xl font-bold text-green-700">Seller Dashboard</CardTitle>
      <Badge variant="blue">Active</Badge>
    </CardHeader>
    <CardContent>
        <p className="text-gray-600">Descriptions placeholder</p>
    </CardContent>
  </Card>
);

export default SellerDashboardHeader;
