require('dotenv').config();

const express = require('express')
const app = express()
const port=process.env.PORT||5000

const connectDB = require('./config/connectDB');

connectDB(); // Connect to MongoDB

app.get('/', (req, res) => {
  res.send('Hello')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
