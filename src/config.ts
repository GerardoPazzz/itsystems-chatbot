import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '150', 10),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
    maxHistory: parseInt(process.env.GEMINI_MAX_HISTORY || '6', 10),
  },
  sap: {
    baseUrl: process.env.SAP_BASE_URL,
    odataMatUrl: process.env.SAP_ODATA_MAT_URL,
    user: process.env.SAP_USER,
    password: process.env.SAP_PASSWORD,
    client: process.env.SAP_CLIENT
  },
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME
  }
};
