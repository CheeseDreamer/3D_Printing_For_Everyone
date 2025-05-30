import React from 'react';

const MyBalancePage = ({ currentUser, transactionHistory }) => {
    if (!currentUser) {
        return <p>Loading user data...</p>;
    }

    const transactions = transactionHistory || [];

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

    return (
        <div className="my-balance-container">
            <div className="current-balance">
                Current Balance: <span>€{(currentUser.balance || 0).toFixed(2)}</span>
            </div>

            <h3>Transaction History</h3>
            {transactions.length > 0 ? (
                <div className="receipt-list">
                    {transactions.map(tx => (
                        <div key={tx.id} className="receipt-card">
                            <div className="receipt-header">
                                <h4>
                                    {tx.transactionType === 'refund' ? 'Refund' : 'Payment'} (Order ID: {tx.orderId})
                                </h4>
                                <span className="receipt-date">
                                    {formatDate(tx.transactionDate)}
                                </span>
                            </div>
                            <div className="receipt-body">
                                <p><strong>File:</strong> {tx.fileName || 'N/A'}</p>
                                <p><strong>Description:</strong> {tx.status}</p>
                                {(tx.transactionType === 'debit' || tx.transactionType === 'refund') && (
                                    <>
                                     <p><strong>Details:</strong> {tx.printerType || 'N/A'} ({tx.printQuality || 'N/A'})</p>
                                    </>
                                )}
                            </div>
                            <div className="receipt-footer">
                                <span>
                                    {tx.transactionType === 'refund' ? 'Amount Refunded:' : 'Amount Paid:'}
                                </span>
                                <span className={`tx-amount ${tx.transactionType === 'refund' ? 'credit' : 'debit'}`}>
                                    €{(tx.transactionAmount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No transactions yet.</p>
            )}
        </div>
    );
};

export default MyBalancePage;