import request from 'supertest';
import express from 'express';

const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock('nodemailer', () => ({
  createTransport: () => mockCreateTransport()
}));

// Config mutable para poder simular que no hay credenciales de correo.
const mockMailConfig = {
  user: 'cuenta@gmail.com',
  appPassword: 'app-password-1234',
  from: 'ITSYSTEMS <cuenta@gmail.com>',
  logoUrl: 'https://agente.itscloud.ai/assets/images/itsystems-logo.png'
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
    }
  }
}));

jest.mock('../src/services/db.service');
jest.mock('../src/services/sap.service');

import * as dbService from '../src/services/db.service';
import * as sapService from '../src/services/sap.service';
import { enviarCredencialesDemo } from '../src/services/mail.service';
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
    mockMailConfig.logoUrl = 'https://agente.itscloud.ai/assets/images/itsystems-logo.png';
    mockSendMail.mockResolvedValue({ messageId: 'mock-1' });
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

  it('debe incluir el logo en el encabezado', async () => {
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    // El logo se referencia por URL publica: Gmail no resuelve las referencias cid
    // cuando el HTML va en quoted-printable (que es como lo codifica nodemailer).
    expect(args.html).toContain('src="https://agente.itscloud.ai/assets/images/itsystems-logo.png"');
    expect(args.html).toContain('alt="ITSYSTEMS"');
  });

  it('no debe adjuntar el logo (se referencia por URL)', async () => {
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

  it('NO debe enviar la version de texto plano cuando hay logo por URL', async () => {
    // Con text plano, nodemailer genera multipart/alternative > multipart/related
    // y el email queda mas pesado de lo necesario.
    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.text).toBeUndefined();
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

  it('debe usar el texto ITSYSTEMS si no hay URL de logo', async () => {
    mockMailConfig.logoUrl = '' as any;

    await enviarCredencialesDemo(credenciales);

    const args = mockSendMail.mock.calls[0][0];
    expect(args.html).not.toContain('<img');
    expect(args.html).toContain('ITSYSTEMS</p>');
    expect(args.text).toContain('UT000123');
  });
});

describe('Controller de registro - Envio de correo', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailConfig.user = 'cuenta@gmail.com';
    mockMailConfig.appPassword = 'app-password-1234';
    mockMailConfig.from = 'ITSYSTEMS <cuenta@gmail.com>';
    mockMailConfig.logoUrl = 'https://agente.itscloud.ai/assets/images/itsystems-logo.png';
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
