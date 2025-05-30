import React from 'react';

const CombinedOrdersPage = ({ orders, onCancelOrder }) => {

    const pendingOrders = orders.filter(o => ['PENDING', 'PROCESSING', 'PRINTING', 'AWAITING_PAYMENT'].includes(o.status.toUpperCase()));
    const historyOrders = orders.filter(o => !['PENDING', 'PROCESSING', 'PRINTING', 'AWAITING_PAYMENT'].includes(o.status.toUpperCase()));
    
     const allOrders = [
        ...pendingOrders.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
        ...historyOrders.sort((a, b) => {
            const dateA = new Date(a.completedAt || a.cancelledAt || a.submittedAt);
            const dateB = new Date(b.completedAt || b.cancelledAt || b.submittedAt);
            return dateB - dateA;
        })
    ];


    if (!allOrders || allOrders.length === 0) {
        return <p>You have no orders.</p>;
    }

    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s.includes('pending') || s.includes('processing') || s.includes('printing')) return "status-pending";
        if (s.includes('completed') || s.includes('shipped')) return "status-completed";
        if (s.includes('cancelled')) return "status-cancelled";
        return '';
    };
    
    const isOrderPending = (status) => {
        const s = status.toLowerCase();
        return s.includes('pending') || s.includes('processing') || s.includes('printing') || s.includes('awaiting_payment');
    };


    return (
        <div className="orders-container">
            {allOrders.map(order => (
                <div key={order.id} className={`order-card ${isOrderPending(order.status) ? 'pending-card' : 'history-card'}`}>
                    <h3>Order ID: {order.id}</h3>
                    <p><strong>File:</strong> {order.fileName || 'N/A'}</p>
                    <p><strong>Type:</strong> {order.printerType || 'N/A'} | <strong>Quality:</strong> {order.printQuality || 'N/A'}</p>
                    <p><strong>Filaments:</strong> {Array.isArray(order.filaments) ? order.filaments.join(', ') : (order.filaments || 'N/A')}</p>
                    <p><strong>Needs Support:</strong> {typeof order.needsSupport === 'boolean' ? (order.needsSupport ? 'Yes' : 'No') : 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={getStatusClass(order.status)}>{order.status}</span></p>
                    <p><strong>Submitted:</strong> {formatDate(order.submittedAt)}</p>
                    {order.completedAt && <p><strong>Completed:</strong> {formatDate(order.completedAt)}</p>}
                    {order.cancelledAt && <p><strong>Cancelled:</strong> {formatDate(order.cancelledAt)}</p>}
                    {typeof order.cost === 'number' && <p><strong>Cost:</strong> €{order.cost.toFixed(2)}</p>}
                    {isOrderPending(order.status) && (
                        <button
                            onClick={() => onCancelOrder(order.id)}
                            className="cancel-button control-button"
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CombinedOrdersPage;