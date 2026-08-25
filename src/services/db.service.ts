import { Pool } from 'pg';
import { config } from '../config';

const pool = new Pool({
  user: config.db.user!,
  password: config.db.password!,
  host: config.db.host!,
  port: config.db.port,
  database: config.db.database!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export interface DatosUsuario {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  actividad: string;
  conocimientos: string;
  institucion: string;
  sap_username: string;
}

export async function verificarEmailExistente(email: string): Promise<boolean> {
  const query = `SELECT id FROM usuarios_sap WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows.length > 0;
}

export async function verificarTelefonoExistente(telefono: string): Promise<boolean> {
  const query = `SELECT id FROM usuarios_sap WHERE telefono = $1`;
  const result = await pool.query(query, [telefono]);
  return result.rows.length > 0;
}

export async function verificarSapUsernameExistente(sap_username: string): Promise<boolean> {
  const query = `SELECT id FROM usuarios_sap WHERE sap_username = $1`;
  const result = await pool.query(query, [sap_username]);
  return result.rows.length > 0;
}

export async function obtenerUsuarioPorEmail(email: string): Promise<string | null> {
  const query = `SELECT id FROM usuarios_sap WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function obtenerUsuarioPorTelefono(telefono: string): Promise<string | null> {
  const query = `SELECT id FROM usuarios_sap WHERE telefono = $1`;
  const result = await pool.query(query, [telefono]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function obtenerUsuarioPorSapUsername(sap_username: string): Promise<string | null> {
  const query = `SELECT id FROM usuarios_sap WHERE sap_username = $1`;
  const result = await pool.query(query, [sap_username]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function verificarCoincidenciaCompleta(
  email: string,
  telefono: string,
  sap_username: string
): Promise<{ coinciden: boolean; usuarioId: string | null }> {
  const query = `
    SELECT id FROM usuarios_sap 
    WHERE email = $1 AND telefono = $2 AND sap_username = $3
  `;
  const result = await pool.query(query, [email, telefono, sap_username]);
  return {
    coinciden: result.rows.length > 0,
    usuarioId: result.rows.length > 0 ? result.rows[0].id : null
  };
}

export async function verificarRolExistente(usuarioId: string, rol_solicitado: string): Promise<boolean> {
  const query = `SELECT id FROM solicitudes_roles WHERE usuario_id = $1 AND rol_solicitado = $2`;
  const result = await pool.query(query, [usuarioId, rol_solicitado]);
  return result.rows.length > 0;
}

export async function verificarSolicitudExistente(
  telefono: string,
  sap_username: string,
  rol_solicitado: string
): Promise<{ existe: boolean; usuarioId: string | null }> {
  const query = `
    SELECT u.id
    FROM usuarios_sap u
    INNER JOIN solicitudes_roles sr ON u.id = sr.usuario_id
    WHERE u.telefono = $1 AND u.sap_username = $2 AND sr.rol_solicitado = $3
  `;
  const result = await pool.query(query, [telefono, sap_username, rol_solicitado]);

  if (result.rows.length > 0) {
    return { existe: true, usuarioId: result.rows[0].id };
  }
  return { existe: false, usuarioId: null };
}

export async function guardarSolicitud(
  datos: DatosUsuario,
  rol_solicitado: string
): Promise<{ success: boolean; usuarioId: string }> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuarioQuery = `SELECT id FROM usuarios_sap WHERE telefono = $1 AND sap_username = $2`;
    const usuarioResult = await client.query(usuarioQuery, [datos.telefono, datos.sap_username]);

    let usuarioId: string;

    if (usuarioResult.rows.length > 0) {
      usuarioId = usuarioResult.rows[0].id;
    } else {
      const insertUsuario = `
        INSERT INTO usuarios_sap (nombre, apellidos, email, telefono, actividad, conocimientos, institucion, sap_username)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const insertResult = await client.query(insertUsuario, [
        datos.nombre,
        datos.apellidos,
        datos.email,
        datos.telefono,
        datos.actividad,
        datos.conocimientos,
        datos.institucion,
        datos.sap_username
      ]);
      usuarioId = insertResult.rows[0].id;
    }

    const insertRol = `
      INSERT INTO solicitudes_roles (usuario_id, rol_solicitado)
      VALUES ($1, $2)
    `;
    await client.query(insertRol, [usuarioId, rol_solicitado]);

    await client.query('COMMIT');
    return { success: true, usuarioId };
  } catch (error: any) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      if (error.constraint === 'usuarios_sap_email_key') {
        throw new Error('Este correo electronico ya esta registrado en el sistema');
      }
      if (error.constraint === 'solicitudes_roles_usuario_id_rol_solicitado_key') {
        throw new Error('El rol ya ha sido asignado anteriormente');
      }
      throw new Error('Error de duplicidad en los datos');
    }

    throw error;
  } finally {
    client.release();
  }
}
