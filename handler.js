'use strict';
const orderManager = require('./orderManager');
const kinesisHelper = require('./kinesisHelper');
const cakeProducerManager = require('./cakeProducerManager');
const deliveryManager = require('./deliveryManager');
const joiHelper = require('./joi-helper');
const winston = require('winston');
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

module.exports.createOrder = async (event) => {
  const body = JSON.parse(event.body);
  const order = orderManager.createOrder(body);
  await joiHelper.OrderCreationvalidateInputParams(order);
  return orderManager.placeOrder(order).then(() => {
    return createResponse(200, `order placed successfully, orderId: ${order.orderId} `);
  }).catch((error) => {
    return createResponse(400, error);
  });
};

module.exports.orderFulfillment = async (event) => {
  const body = JSON.parse(event.body);
  await joiHelper.orderFulfillmentValidateInputParams(body);
  return orderManager.fulfillOrder(body).then(() => {
    return createResponse(200, `order with orderId: ${body.orderId} was sent to delivery`);
  }).catch((error) => {
    return createResponse(400, error);
  });
};

module.exports.notifyDeliveryCompany = async (event) => {
  logger.info('notified to delivery company to pick the order');
  return "delivery done";
}

module.exports.notifyCustomerService = async (event) => {
  logger.info('ask custmer for review');
  return "notify Customer for review";
}

module.exports.orderDelivered = async (event) => {
  const body = JSON.parse(event.body);
  await joiHelper.orderDeliveredValidateInputParams(body);
  return deliveryManager.orderDelivered(body).then(() => {
    return createResponse(200, `order with orderId: ${body.orderId} was delivered successfully by deliveryCompanyId ${body.deliveryCompanyId}`);
  }).catch((error) => {
    return createResponse(400, error);
  });
}

module.exports.notifyExternalParties = async (event) => {
  const records = kinesisHelper.getRecords(event);
  const cakeProducerPromise = getCakeProducerPromise(records);
  const deliveryPromise = getDeliveryPromise(records);
  return Promise.all([cakeProducerPromise, deliveryPromise]).then((h) => {
    return "everything went well";
  })
    .catch((error) => {
      return createResponse(400, error);
    })
};

function getCakeProducerPromise(records) {
  const ordersPlaced = records.filter(r => r.eventType === "order_placed");
  if (ordersPlaced.length > 0) {
    return cakeProducerManager.handlePlacedOrders(ordersPlaced);
  } else {
    return;
  }
}

function getDeliveryPromise(records) {
  const ordersFulfilled = records.filter(r => r.eventType === "order_fulfilled");
  logger.info("ordersFulfilled", JSON.stringify(ordersFulfilled))
  if (ordersFulfilled.length > 0) {
    return deliveryManager.deliveryOrder(ordersFulfilled);
  } else {
    return;
  }
}

function createResponse(statusCode, message) {
  const response = {
    statusCode: statusCode,
    body: JSON.stringify(message)
  }
  return response;
}

