const AWS = require('aws-sdk');
const orderManager = require('./orderManager');
const customerServiceManager = require('./customerServiceManager');
const sqs = new AWS.SQS({
    region: process.env.region
});
const DELIVERY_COMPANY_QUEUE = process.env.deliveryCompanyQueue;

module.exports.deliveryOrder = ordersFulfilled => {
    for (let order of ordersFulfilled) {
        orderManager.updateOrderForDelivery(order.orderId).then(updatedOrder => {
            return orderManager.saveOrder(updatedOrder).then(() => {
                return notifyDeliveryCompany(updatedOrder);
            });
        });
    };
}

function notifyDeliveryCompany(order) {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVERY_COMPANY_QUEUE
    }
    return sqs.sendMessage(params).promise().catch((err) => {
        logger.error(err);
        throw err;
    });
}

module.exports.orderDelivered = order => {
    return orderManager.updateOrderAfterDelivery(order.orderId, order.deliveryCompanyId).then(updatedOrder => {
        return orderManager.saveOrder(updatedOrder).then(() => {
            return customerServiceManager.notifyCustomerServiceForReview(updatedOrder.orderId, order.orderReview);
        });
    });
}