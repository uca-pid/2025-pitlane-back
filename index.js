const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const usersRouter = require('./routes/users');

app.use(express.json());
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
