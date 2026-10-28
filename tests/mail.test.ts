import request from 'supertest';
import express from 'express';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn((_options?: any) => ({ sendMail: mockSendMail }));

jest.mock('nodemailer', () => ({
  createTransport: (options?: any) => mockCreateTransport(options)
}));

// Config mutable para poder simular distintos escenarios de correo.
const mockMailConfig = {
  user: 'cuenta@gmail.com',
  appPassword: 'app-password-1234',
  from: 'ITSYSTEMS <cuenta@gmail.com>'
};

const mockGmailConfig = {
  clientId: 'client-id.apps.googleusercontent.com',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-token-123'
};

jest.mock('../src/config', () => ({
  config: {
    port: 3000,
    db: {
      user: 'db-user',
      password: 'db-pass',
      host: 'localhost',
      port: 5432,
      database: 'test'
    },
    sap: {
      baseUrl: 'https://sap.test',
      odataMatUrl: 'https://sap.test',
      user: 'sap-user',
      password: 'sap-pass',
      client: '300'
    },
    gemini: {
      apiKey: 'test-key',
      model: 'test-model',
      maxTokens: 500,
      temperature: 0.7,
      maxHistory: 6
    },
    admin: { user: 'admin', pass: 'admin' },
    get mail() {
      return mockMailConfig;
    },
    get gmail() {
      return mockGmailConfig;
    }
  }
}));

jest.mock('../src/services/db.service');
jest.mock('../src/services/sap.service');

import * as dbService from '../src/services/db.service';
import * as sapService from '../src/services/sap.service';
import { enviarCredencialesDemo, resetAccessTokenCache } from '../src/services/mail.service';
import { sapRegisterController } from '../src/controllers/sap.controller';

const dbMocks = dbService as jest.Mocked<typeof dbService>;
const sapMocks = sapService as jest.Mocked<typeof sapService>;

const app = express();
app.use(express.json());
app.post('/register', sapRegisterController);

const credenciales = {
  destinatario: 'alumno@test.com',
  nombre: 'Juan Carlos',
  sapUsername: 'UT000123',
  contrasena: 'ITSut000123',
  roleId: 'S4_MM_DEMO',
  requiresFiori: true
};

const datosValidos = {
  nombre: 'Juan',
  apellidos: 'Perez',
  email: 'alumno@test.com',
  telefono: '1234567890',
  actividad: 'Estudiante',
  conocimientos: 'Si',
  institucion: 'Universidad Test',
  roleId: 'S4_MM_DEMO'
};

describe('Servicio de correo - Credenciales de cuenta demo', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailConfig.user = 'cuenta@gmail.com';
    mockMailConfig.appPassword = 'app-password-1234';
    mockMailConfig.from = 'ITSYSTEMS <cuenta@gmail.com>';
    mockGmailConfig.clientId = 'client-id.apps.googleusercontent.com';
    mockGmailConfig.clientSecret = 'client-secret';
    mockGmailConfig.refreshToken = '';
    mockSendMail.mockResolvedValue({ messageId: 'mock-1' });
    global.fetch = jest.fn() as any;
  });

  it('debe enviar al destinatario correcto con el asunto del modulo', async () => {
    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.to).toBe('alumno@test.com');
    expect(args.from).toBe('ITSYSTEMS <cuenta@gmail.com>');
    expect(args.subject).toContain('SAP MM');
    expect(args.subject).toContain('Credenciales de acceso');
  });

  it('debe incluir usuario, contrasena y modulo en el cuerpo del correo', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('UT000123');
    expect(args.html).toContain('ITSut000123');
    expect(args.html).toContain('Juan Carlos');
  });

  it('debe incluir los links de acceso', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('drive.google.com');
    expect(args.html).toContain('s4hana.sapapp.store/webgui');
  });

  it('debe incluir el boton de Fiori solo para los modulos 2023', async () => {
    await enviarCredencialesDemo(credenciales);
    expect(mockSendMail.mock.calls[0][0].html).toContain('s4hana.sapapp.store/fiori');

    mockSendMail.mockClear();

    await enviarCredencialesDemo({ ...credenciales, roleId: 'S4_FI_DEMO', requiresFiori: false });
    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).not.toContain('s4hana.sapapp.store/fiori');
    expect(args.html).toContain('s4hana.itscloud.store/webgui');
  });

  it('debe mostrar el titulo plano ITSYSTEMS en el encabezado', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    // El encabezado va como texto plano: los clientes de correo eliminan el
    // <svg> y no resuelven referencias cid con el HTML en quoted-printable.
    expect(args.html).not.toContain('<img');
    expect(args.html).toContain('ITSYSTEMS</p>');
  });

  it('no debe adjuntar imagenes', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.attachments).toBeUndefined();
  });

  it('debe incluir el whatsapp y el correo en el pie de pagina', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).toContain('wa.me/51940475222');
    expect(args.html).toContain('+51 940 475 222');
    expect(args.html).toContain('mailto:info@itsystems.pe');
  });

  it('debe enviar la version de texto plano con las credenciales', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.text).toContain('UT000123');
    expect(args.text).toContain('ITSut000123');
  });

  it('debe devolver false sin lanzar cuando el envio falla', async () => {
    mockSendMail.mockRejectedValue(new Error('smtp auth failed'));

    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(false);
  });

  it('debe omitir el envio si no hay credenciales configuradas', async () => {
    mockMailConfig.user = undefined as any;
    mockMailConfig.appPassword = undefined as any;

    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(false);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

describe('Controller de registro - Envio de correo', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailConfig.user = 'cuenta@gmail.com';
    mockMailConfig.appPassword = 'app-password-1234';
    mockMailConfig.from = 'ITSYSTEMS <cuenta@gmail.com>';
    mockSendMail.mockResolvedValue({ messageId: 'mock-1' });

    dbMocks.obtenerUsuarioPorEmail.mockResolvedValue(null);
    dbMocks.obtenerUsuarioPorTelefono.mockResolvedValue(null);
    dbMocks.verificarRolExistente.mockResolvedValue(false);
    dbMocks.generarUsernameUnico.mockResolvedValue('UT000123');
    dbMocks.guardarSolicitud.mockResolvedValue({ success: true, usuarioId: '1' });

    sapMocks.registrarAlumno.mockResolvedValue({
      success: true,
      message: 'ok',
      requiresFiori: true,
      statusCode: 200
    } as any);
  });

  it('debe enviar el correo cuando el registro se completa correctamente', async () => {
    const response = await request(app)
      .post('/register')
      .send(datosValidos);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.emailSent).toBe(true);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const args = mockSendMail.mock.calls[0][0];
    expect(args.to).toBe('alumno@test.com');
    expect(args.html).toContain('UT000123');
    expect(args.html).toContain('ITSut000123');
  });

  it('debe completar el registro aunque el envio del correo falle', async () => {
    mockSendMail.mockRejectedValue(new Error('smtp auth failed'));

    const response = await request(app)
      .post('/register')
      .send(datosValidos);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.emailSent).toBe(false);
  });

  it('NO debe enviar correo si falla el registro en SAP', async () => {
    sapMocks.registrarAlumno.mockResolvedValue({
      success: false,
      message: 'error',
      requiresFiori: true,
      statusCode: 500
    } as any);

    const response = await request(app)
      .post('/register')
      .send(datosValidos);

    expect(response.status).toBe(500);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('NO debe enviar correo si falla el guardado en la base de datos', async () => {
    dbMocks.guardarSolicitud.mockRejectedValue(new Error('db error'));

    const response = await request(app)
      .post('/register')
      .send(datosValidos);

    expect(response.status).toBe(500);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

describe('Servicio de correo - Envio por la Gmail API (HTTPS)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailConfig.user = 'cuenta@gmail.com';
    mockMailConfig.appPassword = 'app-password-1234';
    mockMailConfig.from = 'ITSYSTEMS <cuenta@gmail.com>';
    mockGmailConfig.clientId = 'client-id.apps.googleusercontent.com';
    mockGmailConfig.clientSecret = 'client-secret';
    mockGmailConfig.refreshToken = 'refresh-token-123';
    resetAccessTokenCache();

    // El MIME lo construye nodemailer con streamTransport (no envia).
    mockSendMail.mockResolvedValue({
      messageId: 'mock-1',
      message: Buffer.from('Subject: prueba\r\n\r\ncuerpo', 'utf8')
    });

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'access-token-abc', expires_in: 3600 })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'msg-123' })
      }) as any;
  });

  it('debe obtener el access token y enviar por la API de Gmail', async () => {
    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(true);

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // 1) Token
    const tokenCall = fetchMock.mock.calls[0];
    expect(tokenCall[0]).toBe('https://oauth2.googleapis.com/token');
    const tokenBody = tokenCall[1].body.toString();
    expect(tokenBody).toContain('grant_type=refresh_token');
    expect(tokenBody).toContain('refresh_token=refresh-token-123');

    // 2) Envio
    const sendCall = fetchMock.mock.calls[1];
    expect(sendCall[0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
    expect(sendCall[1].headers.Authorization).toBe('Bearer access-token-abc');
    expect(sendCall[1].headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(sendCall[1].body).raw).toBeTruthy();
  });

  it('debe cachear el access token y no pedirlo de nuevo', async () => {
    await enviarCredencialesDemo(credenciales);
    await enviarCredencialesDemo(credenciales);

    const fetchMock = global.fetch as jest.Mock;
    // 2 envios = 1 token (cacheado) + 2 envios
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][0]).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send');
  });

  it('NO debe usar SMTP cuando hay refresh token', async () => {
    await enviarCredencialesDemo(credenciales);

    // mockSendMail se usa solo para construir el MIME. El transporte real
    // debe ser la API de Gmail, no el SMTP de Google.
    const usoSmtp = mockCreateTransport.mock.calls.some(
      args => args[0] && (args[0] as any).service === 'gmail'
    );
    expect(usoSmtp).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      expect.anything()
    );
  });

  it('debe devolver false sin lanzar si el token es invalido', async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'invalid_grant' })
    });

    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(false);
  });

  it('debe devolver false sin lanzar si la API de Gmail responde con error', async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'access-token-abc', expires_in: 3600 })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { message: 'insufficient permissions' } })
      });

    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(false);
  });

  it('debe usar el SMTP como alternativa si no hay refresh token', async () => {
    mockGmailConfig.refreshToken = '';

    const enviado = await enviarCredencialesDemo(credenciales);

    expect(enviado).toBe(true);
    const usoSmtp = mockCreateTransport.mock.calls.some(
      args => args[0] && (args[0] as any).service === 'gmail'
    );
    expect(usoSmtp).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
