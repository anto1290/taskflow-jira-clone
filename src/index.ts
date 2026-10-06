import express from 'express';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import issueRoutes from './routes/issues.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/issues', issueRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
