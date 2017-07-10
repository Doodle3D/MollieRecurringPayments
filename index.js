const express = require('express');
const bodyParser = require('body-parser');
const mollie = require('./mollie.js');

// Application setup.
const app = express();
// only one profile supported in this example
const profile = {
  name: 'bob-live',
  email: 'bob-live@doodle3d.com',
  payment: {} // only one payment supported in this example
}
const product = {
  description: 'Test product',
  price: 20
}
const rootURL = process.env.ROOT_URL;

// Setup route.
app.get('/', function(req, res, next) {
  console.log('/');
  mollie.getOrCreateCostumer(profile).then(customer => {
    console.log('customer: ', customer);
    const paymentData = {
      amount: product.price, // 0.01
      customerId: customer.id,
      recurringType: 'first',
      description: product.description,
      redirectUrl: `${rootURL}redirect/`,
      webhookUrl: `${rootURL}webhook`,
      metadata: { username:  profile.name },
      // method: 'ideal'
    };
    console.log('paymentData: ', paymentData);;
    return mollie.createPayment(paymentData).then(response => {
      console.log('payment response: ', response);
      profile.payment = response;
      res.send(`Payment created, go to: <a href="${response.links.paymentUrl}">Mollie payment page</a>`);
    });
  }).catch(next);
});
app.post('/webhook', [bodyParser.urlencoded()], (req, res, next) => {
  console.log('/webhook req.body: ', req.body);
  console.log('profile: ', profile);
  const { id } = req.body;
  
  if (id !== profile.payment.id) {
    // console.log('Unknown payment: ', id);
    // return;
    return next(new Error(`Unknown payment: ${id}`));
  }
  mollie.getPayment(id).then(payment => {
    console.log('payment: ', payment);
    profile.payment = payment;
    const { username } = payment.metadata;
    // payment was successfully paid
    if (payment.isPaid()) {
      console.log('payment was paid');
      res.end();
    // payment isn't paid or open, so it's probobably aborted
    } else if (!payment.isOpen()) {
      console.log('payment was aborted / failed');
      res.end();
    } else {
      res.end();
    }
  }).catch(next);
});
app.get('/redirect', function(req, res) {
  console.log('/redirect profile: ', profile);
  res.send(`Payment status: ${profile.payment.status}`);
});
app.use((err, req, res, next) => {
  console.log('error handler: ', err);
  // Voucherify errors include a code
  const body = {
    status: 'error',
    message: err.message ? err.message : err,
    data: err
  };
  if (err.validationErrors) body.validationErrors = err.validationErrors;
  const statusCode = err.status || err.code || 500;
  console.log('statusCode: ', statusCode);
  return res.status(statusCode).json(body);
});

const listener = app.listen(process.env.PORT|3000, function () {
  console.log('Example app listening on ', listener.address().port);
});
