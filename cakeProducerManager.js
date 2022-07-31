const AWS = require('aws-sdk');
const ses = new AWS.SES({
    region: process.env.region
});

const CAKE_PRODUCER_EMAIL = process.env.cakeProducerEmail;

module.exports.handlePlacedOrders = (ordersPlaced) => {
    var ordersPlacedPromises = [];
    for (let order of ordersPlaced) {
        const temp = notifycakeProducerByEmail(order);
        ordersPlacedPromises.push(temp);
    }
    return Promise.all(ordersPlacedPromises);
}

function notifycakeProducerByEmail(order) {
    const params = {
        Destination: {
            ToAddresses: [CAKE_PRODUCER_EMAIL]
        },
        Message: {
            Body: {
                Text: {
                    Data: JSON.stringify(order)
                }
            },
            Subject: {
                Data: 'New Cake Order'
            }
        },
        Source: "anushakurra10@yopmail.com"
    };
    return ses.sendEmail(params).promise().then((data) => {
        return data;
    }).catch((error) => {
        return error;
    })
}

