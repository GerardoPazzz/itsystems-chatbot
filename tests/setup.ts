beforeAll(() => {
  process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
  process.env.OLLAMA_MODEL = 'llama3.1';
  process.env.OLLAMA_NUM_PREDICT = '100';
  process.env.OLLAMA_TEMPERATURE = '0.7';
  process.env.SAP_BASE_URL = 'https://s4hana.itscloud.store:443';
  process.env.SAP_ODATA_MAT_URL = 'https://s4hana.sapapp.store:443';
  process.env.SAP_USER = 'ITSDEMOAGENT';
  process.env.SAP_PASSWORD = 'ITSystems@2026!';
  process.env.SAP_CLIENT = '300';
  process.env.DB_USER = 'api_backend';
  process.env.DB_PASSWORD = 'ITS_BACK_END2026';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'ag_itsystems';
});

afterAll(async () => {
});
