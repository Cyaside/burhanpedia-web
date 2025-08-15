export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'development'
};

export const getApiUrl = (endpoint: string) => {
  return `${config.apiUrl}${endpoint}`;
};
