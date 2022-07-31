const uuid = require('uuid');
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();
const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ]
});
module.exports.createOrder = body => {
    const order = {
        orderId: uuid.v1(),
        name: body.name,
        address: body.address,
        productId: body.productId,
        quantity: body.quantity,
        orderDate: new Date().toISOString(),
        eventType: 'order_placed'
    };
    return order;
}

module.exports.placeOrder = order => {
    return this.saveOrder(order).then(() => {
        return placeOrderStream(order);
    })
}

module.exports.saveOrder = (order) => {
    const params = {
        TableName: process.env.OrderTableName,
        Item: order
    };
    return dynamo.put(params).promise();
}

function placeOrderStream(order) {
    const params = {
        Data: JSON.stringify(order),
        PartitionKey: order.orderId,
        StreamName: process.env.OrderStreamName
    }
    return kinesis.putRecord(params).promise();
}

module.exports.fulfillOrder = order => {
    return getOrder(order.orderId).then((savedOrder) => {
        const updatedOrder = createFulfillmentOrder(savedOrder, order.fulfillmentId);
        return this.saveOrder(updatedOrder).then(() => {
            return placeOrderStream(updatedOrder);
        })
    }).catch((err) => {
        logger.error("no order with this orderId exists", JSON.stringify(err));
        throw "no order with this orderId exists";
    });
}

function getOrder(orderId) {
    const params = {
        Key: {
            orderId: orderId
        },
        TableName: process.env.OrderTableName
    };
    return dynamo.get(params).promise().then(result => {
        return result.Item;
    }).catch((err) => {
        logger.error("no order with this orderId exists" + JSON.stringify(err));
        throw "no order with this orderId exists";
    });
}

function createFulfillmentOrder(savedOrder, fulfillmentId) {
    savedOrder.fulfillmentId = fulfillmentId;
    savedOrder.fulfillmentDate = new Date().toISOString(),
        savedOrder.eventType = 'order_fulfilled';
    return savedOrder;
}

module.exports.updateOrderForDelivery = orderId => {
    return getOrder(orderId).then((order) => {
        order.sentToDeliveryDate = new Date().toISOString();
        return order;
    }).catch((err) => {
        logger.error("error in order fulfillment", err);
        throw "error in order fulfillment";
    });
}

module.exports.updateOrderAfterDelivery = (orderId, deliveryCompanyId) => {
    return getOrder(orderId).then((order) => {
        order.deliveryCompanyId = deliveryCompanyId
        order.deliveryDate = Date.now();
        console.log("updateOrderAfterDelivery", JSON.stringify(order));
        return order;
    }).catch((err) => {
        logger.error("error in order delivery", err);
        throw "error in order delivery";
    });
}
