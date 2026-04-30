/* Imports */
import express from 'express';
import serverless from 'serverless-http';
import { connectLambda } from "@netlify/blobs";
import { default as helmet } from 'helmet';
import { default as apiRouter } from './routes/apiRouter';
const app = express();

/* Middleware */
app.use(helmet());

/* Routes */
app.use('/api', apiRouter);
app.use((req, res, next) => { res.sendStatus(404); })

/* Error Handler */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendStatus(500);
})

/* Serverless Function */
const handler = serverless(app);
const _handler = async (event, context) => {
  connectLambda(event);
  return await handler(event, context);
};
export { _handler as handler };