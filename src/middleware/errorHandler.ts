import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Prisma known error codes
  if (err['code'] === 'P2002') {
    return res.status(409).json({ error: 'Duplicate key violation', details: err.message });
  }
  if (err['code'] === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

// ponytail: add structured logging (pino/winston) and request-id correlation when multi-tenant
