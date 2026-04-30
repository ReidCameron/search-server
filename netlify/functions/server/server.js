/* Imports */
const express = require('express');
const serverless = require('serverless-http');
const app = express();
const { connectLambda } = require("@netlify/blobs");
const { default: helmet } = require('helmet');

/* Middleware */
app.use(helmet());

/* Routes */
app.use('/api', require('./routes/apiRouter'));
app.use((req, res, next) => { res.sendStatus(404); })

/* Error Handler */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendStatus(500);
})

/* Serverless Function */
const handler = serverless(app);
module.exports.handler = async (event, context) => {
    connectLambda(event);
    return await handler(event, context);
};