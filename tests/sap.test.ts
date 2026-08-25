import request from 'supertest';
import express from 'express';

jest.mock('../src/services/db.service');
jest.mock('../src/services/sap.service');

import * as dbService from '../src/services/db.service';
import * as sapService from '../src/services/sap.service';
import { sapRegisterController } from '../src/controllers/sap.controller';

const app = express();
app.use(express.json());
app.post('/register', sapRegisterController);

const dbMocks = dbService as jest.Mocked<typeof dbService>;
const sapMocks = sapService as jest.Mocked<typeof sapService>;

const datosValidos = {
  nombre: 'Juan',
  apellidos: 'Perez',
  email: 'juan.perez@test.com',
  telefono: '1234567890',
  actividad: 'Estudiante',
  conocimientos: 'Si',
  institucion: 'Universidad Test',
  sap_username: 'JPEREZ001',
  roleId: 'S4_FI_DEMO'
};

describe('SAP Register Controller - Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validaciones de Campos Requeridos', () => {

    it('debe responder 400 si nombre esta vacio', async () => {
      const response = await request(app)
        .post('/register')
        .send({ ...datosValidos, nombre: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nombre es requerido');
    });

    it('debe responder 400 si nombre falta', async () => {
      const { nombre, ...sinNombre } = datosValidos;
      const response = await request(app)
        .post('/register')
        .send(sinNombre);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Nombre es requerido');
    });

    it('debe responder 400 si apellidos vacio', async () => {
      const response = await request(app)
        .post('/register')
        .send({ ...datosValidos, apellidos: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Apellidos son requeridos');
    });

    it('debe responder 400 si email vacio', async () => {
      const response = await request(app)
        .post('/register')
        .send({ ...datosValidos, email: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email es requerido');
    });

    it('debe responder 400 si telefono supera 12 caracteres', async () => {
      const response = await request(app)
        .post('/register')
        .send({ ...datosValidos, telefono: '1234567890123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El telefono no puede superar los 12 caracteres');
    });

    it('debe responder 400 si sap_username supera 12 caracteres', async () => {
      const response = await request(app)
        .post('/register')
        .send({ ...datosValidos, sap_username: '1234567890123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El usuario SAP no puede superar los 12 caracteres');
    });

    it('debe responder 400 si roleId falta', async () => {
      const { roleId, ...sinRoleId } = datosValidos;
      const response = await request(app)
        .post('/register')
        .send(sinRoleId);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rol es requerido');
    });
  });

  describe('Verificaciones de Coincidencia', () => {

    it('debe responder 400 si los datos no coinciden exactamente (solo email existe)', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: false, usuarioId: null });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Los datos que proporcionaste ya están registrados en nuestro sistema. Si deseas registrar un nuevo rol, usa el mismo usuario SAP con el que te registraste inicialmente.');
    });

    it('debe responder 400 si los datos no coinciden exactamente (solo telefono existe)', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: false, usuarioId: null });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Los datos que proporcionaste ya están registrados en nuestro sistema. Si deseas registrar un nuevo rol, usa el mismo usuario SAP con el que te registraste inicialmente.');
    });

    it('debe responder 400 si los datos no coinciden exactamente (solo username existe)', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: false, usuarioId: null });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Los datos que proporcionaste ya están registrados en nuestro sistema. Si deseas registrar un nuevo rol, usa el mismo usuario SAP con el que te registraste inicialmente.');
    });

    it('debe responder 400 si los 3 datos coinciden pero el rol ya existe', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: true, usuarioId: 'usuario-uuid-123' });
      dbMocks.verificarRolExistente = jest.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Ya tienes asignado el rol que solicitaste. Si deseas cambiar de rol, contacta a un asesor.');
    });

    it('debe responder 200 si los 3 datos coinciden pero el rol es nuevo', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: true, usuarioId: 'usuario-uuid-123' });
      dbMocks.verificarRolExistente = jest.fn().mockResolvedValue(false);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockResolvedValue({ success: true, usuarioId: 'usuario-uuid-123' });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Registro Exitoso - Usuario Nuevo', () => {

    it('debe responder 200 cuando es un usuario completamente nuevo', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockResolvedValue({ success: true, usuarioId: 'nuevo-usuario-uuid' });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registro exitoso');
      expect(response.body.requiresFiori).toBe(false);
    });

    it('debe convertir sap_username a mayusculas', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockResolvedValue({ success: true, usuarioId: 'nuevo-usuario-uuid' });

      const datosConMinusculas = { ...datosValidos, sap_username: 'jperez001' };

      await request(app)
        .post('/register')
        .send(datosConMinusculas);

      expect(sapMocks.registrarAlumno).toHaveBeenCalledWith('JPEREZ001', datosValidos.roleId);
    });
  });

  describe('Errores de SAP', () => {

    it('debe responder 500 si SAP falla', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: false, message: 'SAP error', requiresFiori: false, statusCode: 500 });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.');
    });

    it('debe responder 403 si SAP devuelve 403', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: false, message: 'Forbidden', requiresFiori: false, statusCode: 403 });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.');
    });
  });

  describe('Errores de BD en Guardado', () => {

    it('debe responder 400 si rol duplicado en guardado', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue('usuario-uuid-123');
      dbMocks.verificarCoincidenciaCompleta = jest.fn().mockResolvedValue({ coinciden: true, usuarioId: 'usuario-uuid-123' });
      dbMocks.verificarRolExistente = jest.fn().mockResolvedValue(false);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockRejectedValue(new Error('El rol ya ha sido asignado anteriormente'));

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('El rol ya ha sido asignado anteriormente');
    });

    it('debe responder 500 si error generico de BD', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockRejectedValue(new Error('Error de conexion'));

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.');
    });
  });

  describe('requiresFiori en Respuesta', () => {

    it('debe retornar requiresFiori=true para roles MM/SD/PM', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: true, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockResolvedValue({ success: true, usuarioId: 'nuevo-usuario-uuid' });

      const datosConRoleNuevo = { ...datosValidos, roleId: 'S4_MM_DEMO' };

      const response = await request(app)
        .post('/register')
        .send(datosConRoleNuevo);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requiresFiori).toBe(true);
    });

    it('debe retornar requiresFiori=false para roles FI/PP', async () => {
      dbMocks.obtenerUsuarioPorEmail = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorTelefono = jest.fn().mockResolvedValue(null);
      dbMocks.obtenerUsuarioPorSapUsername = jest.fn().mockResolvedValue(null);
      sapMocks.registrarAlumno = jest.fn().mockResolvedValue({ success: true, message: 'Registro exitoso', requiresFiori: false, statusCode: 200 });
      dbMocks.guardarSolicitud = jest.fn().mockResolvedValue({ success: true, usuarioId: 'nuevo-usuario-uuid' });

      const response = await request(app)
        .post('/register')
        .send(datosValidos);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.requiresFiori).toBe(false);
    });
  });
});
