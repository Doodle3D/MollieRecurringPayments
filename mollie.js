const Mollie = require('mollie-api-node');

const mollieClient = new Mollie.API.Client;
mollieClient.setApiKey(process.env.MOLLIE_KEY);

const getOrCreateCostumer = module.exports.getOrCreateCostumer = function(profile) {
  return new Promise((resolve, reject) => {
    if (!profile.mollieData) profile.mollieData = {};
    if (profile.mollieData.customer) return resolve(profile.mollieData.customer);
    createCostumer(profile).then(customer => {
      profile.mollieData.customer = customer;
      resolve(customer);
    }).catch(reject);
  })
};

const createCostumer = module.exports.createCostumer = function(profile) {
  return new Promise((resolve, reject) => {
    mollieClient.customers.create({
      name: profile.name,
      email: profile.email
    }, (result) => {
      if (result.error) {
        reject(result.error);
      } else {
        resolve(result);
      }
    });
  });
};

const getPayment = module.exports.getPayment = function(id) {
  return new Promise((resolve, reject) => {
    mollieClient.payments.get(id, response => {
      if (response.error) return resolve(response.error);
      resolve(response);
    });
  });
}

const createPayment = module.exports.createPayment = function(payment) {
  return new Promise((resolve, reject) => {
    mollieClient.payments.create(payment, response => {
      if (response.error) return reject(response.error);
      resolve(response);
    })
  });
}
