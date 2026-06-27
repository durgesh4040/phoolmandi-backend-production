import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export const requestStorage = new AsyncLocalStorage();

export const requestIdMiddleware = (req, res, next) => {
  const id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', id);
  requestStorage.run({ requestId: id }, next);
};

export const getRequestId = () => requestStorage.getStore()?.requestId || '-';
