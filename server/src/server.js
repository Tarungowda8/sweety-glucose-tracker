const config = require('./config');
const app = require('./app');

app.listen(config.port, () => {
  console.log(`Sweety API running on http://localhost:${config.port}`);
});
