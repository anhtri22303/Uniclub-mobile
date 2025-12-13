import { AxiosResponse } from 'axios';

export const mockAxiosResponse = <T>(data: T, status = 200): AxiosResponse<T> => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {} as any,
  },
});

export const mockAxiosError = (message: string, status = 400, data?: any) => ({
  response: {
    data: data || { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {
      headers: {} as any,
    },
  },
  message,
  config: {
    headers: {} as any,
  },
  isAxiosError: true,
});
