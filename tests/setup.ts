beforeAll(() => {
  process.env.SAP_BASE_URL = 'https://tu-servidor-sap.com:443';
  process.env.SAP_ODATA_MAT_URL = 'https://tu-servidor-sap.com:443';
  process.env.SAP_USER = 'tu_usuario_sap';
  process.env.SAP_PASSWORD = 'tu_password_sap';
  process.env.SAP_CLIENT = '300';
  process.env.DB_USER = 'tu_usuario_db';
  process.env.DB_PASSWORD = 'tu_password_db';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'ag_itsystems';
});

afterAll(async () => {
});
