import { Request, Response } from 'express';
import { registrarAlumno } from '../services/sap.service';
import {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorTelefono,
  verificarRolExistente,
  guardarSolicitud,
  generarUsernameUnico,
  DatosUsuario
} from '../services/db.service';

interface DatosRegistro extends DatosUsuario {
  roleId: string;
}

export const sapRegisterController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const datos: DatosRegistro = req.body;

    if (!datos.nombre || typeof datos.nombre !== 'string' || datos.nombre.trim() === '') {
      res.status(400).json({ error: 'Nombre es requerido' });
      return;
    }

    if (!datos.apellidos || typeof datos.apellidos !== 'string' || datos.apellidos.trim() === '') {
      res.status(400).json({ error: 'Apellidos son requeridos' });
      return;
    }

    if (!datos.email || typeof datos.email !== 'string' || datos.email.trim() === '') {
      res.status(400).json({ error: 'Email es requerido' });
      return;
    }

    if (!datos.roleId || typeof datos.roleId !== 'string') {
      res.status(400).json({ error: 'Rol es requerido' });
      return;
    }

    if (datos.telefono && datos.telefono.length > 12) {
      res.status(400).json({ error: 'El telefono no puede superar los 12 caracteres' });
      return;
    }

    const emailId = await obtenerUsuarioPorEmail(datos.email.trim());
    const telefonoId = await obtenerUsuarioPorTelefono(datos.telefono?.trim() || '');

    if (emailId && telefonoId) {
      const rolExiste = await verificarRolExistente(emailId, datos.roleId);
      if (rolExiste) {
        res.status(400).json({ error: 'email_telefono', message: 'Este email y telefono ya estan registrados. Si ya tienes un rol asignado, contacta a un asesor para cambiarlo.' });
        return;
      }
      res.status(400).json({ error: 'email_telefono', message: 'Este email y telefono ya estan registrados.' });
      return;
    }

    if (emailId) {
      const rolExiste = await verificarRolExistente(emailId, datos.roleId);
      if (rolExiste) {
        res.status(400).json({ error: 'email', message: 'Este email ya esta registrado. Si ya tienes un rol asignado, contacta a un asesor para cambiarlo.' });
        return;
      }
      res.status(400).json({ error: 'email', message: 'Este email ya esta registrado.' });
      return;
    }

    if (telefonoId) {
      const rolExiste = await verificarRolExistente(telefonoId, datos.roleId);
      if (rolExiste) {
        res.status(400).json({ error: 'telefono', message: 'Este telefono ya esta registrado. Si ya tienes un rol asignado, contacta a un asesor para cambiarlo.' });
        return;
      }
      res.status(400).json({ error: 'telefono', message: 'Este telefono ya esta registrado.' });
      return;
    }

    const sapUsername = await generarUsernameUnico();

    const usuarioData: DatosUsuario = {
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      email: datos.email.trim(),
      telefono: datos.telefono?.trim() || '',
      actividad: datos.actividad?.trim() || '',
      conocimientos: datos.conocimientos || '',
      institucion: datos.institucion?.trim() || ''
    };

    const resultSap = await registrarAlumno(sapUsername, datos.roleId);

    if (!resultSap.success) {
      res.status(resultSap.statusCode).json({ error: 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.' });
      return;
    }

    await guardarSolicitud(usuarioData, datos.roleId, sapUsername);

    res.json({
      success: true,
      message: 'Registro exitoso',
      requiresFiori: resultSap.requiresFiori,
      sapUsername: sapUsername
    });
  } catch (error: any) {
    console.error('[Controller] Error:', error.message);

    if (error.message.includes('ya esta registrado') || error.message.includes('ya ha sido asignado')) {
      res.status(400).json({ error: 'general', message: error.message });
      return;
    }

    res.status(500).json({ error: 'general', message: 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.' });
  }
};
