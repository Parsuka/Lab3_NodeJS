import express from 'express';
import cors from 'cors';
import recipeRouter from './routes/recipe';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/recipes', recipeRouter);

app.use(errorHandler);

export default app;
