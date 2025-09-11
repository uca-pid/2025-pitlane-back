const express = require('express');
const app = express();
const PORT = process.env.PORT || 3005;


const routes = require('./routes');

app.use(express.json());
app.use('/', routes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
