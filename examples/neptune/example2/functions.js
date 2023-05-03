module.exports = { getRandomFloat };

function getRandomFloat(context, events, done) {
  let min = 0;
  let max = 1;
  let decimals = 2;
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  context.vars['randomFloat'] = str;
  return done();
};