

import React from 'react';
import './TransactionHistory.css';

const transactions = [
  {
    id: 'GD001',
    type: 'Đổi pin',
    station: 'Trạm Lê Lợi',
    date: '20/10/2025',
    time: '14:00',
    amount: '-50.000đ',
    status: 'Thành công',
  },
  {
    id: 'GD002',
    type: 'Thanh toán',
    station: 'Trạm Nguyễn Huệ',
    date: '18/10/2025',
    time: '09:30',
    amount: '-120.000đ',
    status: 'Thành công',
  },
  {
    id: 'GD003',
    type: 'Đổi pin',
    station: 'Trạm Lê Lợi',
    date: '15/10/2025',
    time: '16:00',
    amount: '-50.000đ',
    status: 'Đã hủy',
  },
];

export default function TransactionHistory() {
  return (
    <div className="transaction-container">
      <div className="transaction-card">
        <h2 className="transaction-title">Lịch sử giao dịch</h2>
        <div className="transaction-desc">Danh sách các giao dịch, đổi pin, thanh toán, và các hoạt động liên quan đến tài khoản.</div>
        {transactions.length === 0 ? (
          <div className="transaction-empty">Chưa có giao dịch nào.</div>
        ) : (
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Loại</th>
                <th>Trạm</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td className="tx-id">{tx.id}</td>
                  <td>{tx.type}</td>
                  <td>{tx.station}</td>
                  <td>{tx.date}</td>
                  <td>{tx.time}</td>
                  <td className="tx-amount">{tx.amount}</td>
                  <td className={tx.status==='Thành công' ? 'tx-success' : 'tx-failed'}>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
