import { Request, Response } from 'express';
import { registrarAlumno } from '../services/sap.service';
import {
  obtenerUsuarioPorEmail,
  obtenerUsuarioPorTelefono,
  obtenerUsuarioPorSapUsername,
  verificarCoincidenciaCompleta,
  verificarRolExistente,
  guardarSolicitud,
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

    if (!datos.sap_username || typeof datos.sap_username !== 'string' || datos.sap_username.trim() === '') {
      res.status(400).json({ error: 'Usuario SAP es requerido' });
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

    if (datos.sap_username.length < 5) {
      res.status(400).json({ error: 'El usuario SAP debe tener al menos 5 caracteres' });
      return;
    }

    if (datos.sap_username.length > 8) {
      res.status(400).json({ error: 'El usuario SAP no puede superar los 8 caracteres' });
      return;
    }

    const emailId = await obtenerUsuarioPorEmail(datos.email.trim());
    const telefonoId = await obtenerUsuarioPorTelefono(datos.telefono?.trim() || '');
    const usernameId = await obtenerUsuarioPorSapUsername(datos.sap_username.trim().toUpperCase());

    const algunExistente = emailId || telefonoId || usernameId;

    if (algunExistente) {
      const coincidencias = await verificarCoincidenciaCompleta(
        datos.email.trim(),
        datos.telefono?.trim() || '',
        datos.sap_username.trim().toUpperCase()
      );

      if (coincidencias.coinciden && coincidencias.usuarioId) {
        const rolExiste = await verificarRolExistente(coincidencias.usuarioId, datos.roleId);
        if (rolExiste) {
          res.status(400).json({ error: 'Ya tienes asignado el rol que solicitaste. Si deseas cambiar de rol, contacta a un asesor.' });
          return;
        }
      } else {
        res.status(400).json({
          error: 'Los datos que proporcionaste ya están registrados en nuestro sistema. Si deseas registrar un nuevo rol, usa el mismo usuario SAP con el que te registraste inicialmente.'
        });
        return;
      }
    }

    const usuarioData: DatosUsuario = {
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      email: datos.email.trim(),
      telefono: datos.telefono?.trim() || '',
      actividad: datos.actividad?.trim() || '',
      conocimientos: datos.conocimientos || '',
      institucion: datos.institucion?.trim() || '',
      sap_username: datos.sap_username.trim().toUpperCase()
    };

    const resultSap = await registrarAlumno(usuarioData.sap_username, datos.roleId);

    if (!resultSap.success) {
      res.status(resultSap.statusCode).json({ error: 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.' });
      return;
    }

    await guardarSolicitud(usuarioData, datos.roleId);

    res.json({ 
      success: true, 
      message: 'Registro exitoso',
      requiresFiori: resultSap.requiresFiori 
    });
  } catch (error: any) {
    console.error('[Controller] Error:', error.message);

    if (error.message.includes('ya esta registrado') || error.message.includes('ya ha sido asignado')) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.' });
  }
};
