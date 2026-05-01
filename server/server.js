/* Imports */
import express from 'express';
import serverless from 'serverless-http';
import { connectLambda } from "@netlify/blobs";
import { default as helmet } from 'helmet';
import { default as apiRouter } from './routes/apiRouter.js';
const app = express();

/* Middleware */
app.use(helmet());
app.use((req, res, next) => {
  res
    .header("access-control-allow-methods", "GET, HEAD")
    .header("access-control-allow-origin","*")
  next();
});

/* Routes */
app.use('/api', apiRouter);
app.use((req, res, next) => { res.sendStatus(404); });

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