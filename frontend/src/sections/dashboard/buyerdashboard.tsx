import React from 'react';

interface BankAccount {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface Coupon {
  id: number;
  code: string;
  discount: string;
  expiry: string;
}

interface BuyerDashboardProps {
  name: string;
  email: string;
  profileImage?: string;
  balance: number;
  coupons: Coupon[];
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  name,
  email,
  profileImage,
  balance,
  coupons,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
            {typeof name === 'string' && name.length > 0 ? name.charAt(0) : '?'}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {typeof name === 'string' && name.length > 0 ? name : <span className="italic text-gray-400">Username</span>}
          </h2>
          <p className="text-gray-500">{email}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2 text-gray-700">Balance</h3>
        <div className="bg-white rounded-lg shadow p-4 text-2xl font-bold text-green-700">
          Rp {balance.toLocaleString('id-ID')}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2 text-gray-700">Coupons</h3>
        {coupons.length === 0 ? (
          <p className="text-gray-400">No coupons available.</p>
        ) : (
          <ul className="space-y-2">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="bg-green-50 rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-green-700">Code: {coupon.code}</div>
                  <div className="text-green-600">Discount: {coupon.discount}</div>
                  <div className="text-green-500">Expires: {coupon.expiry}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;
