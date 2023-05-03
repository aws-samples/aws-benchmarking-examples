const axios = require('axios');
module.exports = { getRandomFloat,getRandomNode };

function getRandomFloat(context, events, done) {
  let min = 0;
  let max = 1;
  let decimals = 2;
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  context.vars['randomFloat'] = str;
  return done();
};

async function getRandomNode(context, events, done) {
  let res = await axios.get("https://<API_ENDPOINT>);
  context.vars['randomNode'] = res.data;
  return done();
};