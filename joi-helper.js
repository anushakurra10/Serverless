const Joi = require('joi');
const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ]
});

module.exports.OrderCreationvalidateInputParams = (order) => {
    logger.info("OrderCreationvalidateInputParams", order);
    const schema = Joi.object({
        orderId: Joi.string().required(),
        productId: Joi.number().required(),
        quantity: Joi.number().required(),
        name: Joi.string().required(),
        address: Joi.string().required(),
        orderDate: Joi.string().optional(),
        eventType: Joi.string().optional()
    });
    const createOrderScheme = schema.validate(order);
    if (createOrderScheme.error) {
        logger.error(createOrderScheme.error.details);
        throw (createOrderScheme.error.details);
    }
    else {
        logger.info("Validated Data")
    }
}

module.exports.orderFulfillmentValidateInputParams = (order) => {
    logger.info("orderFulfillmentValidateInputParams", order);
    const schema = Joi.object({
        orderId: Joi.string().required(),
        fulfillmentId: Joi.string().required(),
        fulfillmentDate: Joi.string().optional(),
        eventType: Joi.string().optional()
    });
    const fulfillOrderScheme = schema.validate(order);
    if (fulfillOrderScheme.error) {
        logger.error(fulfillOrderScheme.error.details);
        throw (fulfillOrderScheme.error.details);
    }
    else {
        logger.info("Validated Data")
    }
}

module.exports.orderDeliveredValidateInputParams = (order) => {
    logger.info("orderDeliveredValidateInputParams", order);
    const schema = Joi.object({
        orderId: Joi.string().required(),
        deliveryCompanyId: Joi.string().required(),
        orderReview: Joi.string().optional()
    });
    const orderDeliveredScheme = schema.validate(order);
    if (orderDeliveredScheme.error) {
        logger.error(orderDeliveredScheme.error.details);
        throw (orderDeliveredScheme.error.details);
    }
    else {
        logger.info("Validated Data")
    }
}
