import request from 'supertest';
import express from 'express';

jest.mock('../src/services/db.service');
jest.mock('../src/services/sap.service');
// Evita que los tests envien correos reales durante el registro.
jest.mock('../src/services/mail.service');

import * as dbService from '../src/services/db.service';
import * as sapService from '../src/services/sap.service';
import { sapRegisterController } from '../src/controllers/sap.controller';

const app = express();
app.use(express.json());
app.post('/register', sapRegisterController);

const dbMocks = dbService as jest.Mocked<typeof dbService>;
const sapMocks = sapService as jest.Mocked<typeof sapService>;

const datosObligatorios = {
  nombre: 'Juan',
  apellidos: 'Perez',
  email: 'juan.perez@test.com',
  telefono: '1234567890',
  roleId: 'S4_FI_DEMO'
};

describe('SAP Register - Campos opcionales con valor por defecto N/A', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    dbMocks.obtenerUsuarioPorEmail.mockResolvedValue(null);
    dbMocks.obtenerUsuarioPorTelefono.mockResolvedValue(null);
    dbMocks.verificarRolExistente.mockResolvedValue(false);
    dbMocks.generarUsernameUnico.mockResolvedValue('TEST001');
    dbMocks.guardarSolicitud.mockResolvedValue({ success: true, usuarioId: '1' });

    sapMocks.registrarAlumno.mockResolvedValue({
      success: true,
      requiresFiori: false
    } as any);
  });

  it('debe guardar N/A en actividad, conocimientos e institucion cuando no se envian', async () => {
    const response = await request(app)
      .post('/register')
      .send(datosObligatorios);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(dbMocks.guardarSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Juan',
        apellidos: 'Perez',
        email: 'juan.perez@test.com',
        telefono: '1234567890',
        actividad: 'N/A',
        conocimientos: 'N/A',
        institucion: 'N/A'
      }),
      'S4_FI_DEMO',
      'TEST001'
    );
  });

  it('debe guardar N/A cuando los campos opcionales llegan vacios', async () => {
    await request(app)
      .post('/register')
      .send({ ...datosObligatorios, actividad: '', conocimientos: '', institucion: '' });

    expect(dbMocks.guardarSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        actividad: 'N/A',
        conocimientos: 'N/A',
        institucion: 'N/A'
      }),
      'S4_FI_DEMO',
      'TEST001'
    );
  });

  it('debe conservar los valorescuando los campos opcionales si se envian', async () => {
    await request(app)
      .post('/register')
      .send({
        ...datosObligatorios,
        actividad: 'Estudiante',
        conocimientos: 'Si',
        institucion: 'Universidad Test'
      });

    expect(dbMocks.guardarSolicitud).toHaveBeenCalledWith(
      expect.objectContaining({
        actividad: 'Estudiante',
        conocimientos: 'Si',
        institucion: 'Universidad Test'
      }),
      'S4_FI_DEMO',
      'TEST001'
    );
  });

  it('debe registrar correctamente solo con los 5 campos obligatorios', async () => {
    const response = await request(app)
      .post('/register')
      .send(datosObligatorios);

    expect(response.status).toBe(200);
    expect(response.body.sapUsername).toBe('TEST001');
    expect(sapMocks.registrarAlumno).toHaveBeenCalledWith('TEST001', 'S4_FI_DEMO');
  });
});
