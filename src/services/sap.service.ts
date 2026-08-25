import axios from 'axios';
import https from 'https';
import { config } from '../config';

const sapClientOriginal = axios.create({
  baseURL: config.sap.baseUrl!,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true,
  auth: {
    username: config.sap.user!,
    password: config.sap.password!
  }
});

const sapClientNew = axios.create({
  baseURL: config.sap.odataMatUrl!,
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  withCredentials: true,
  auth: {
    username: config.sap.user!,
    password: config.sap.password!
  }
});

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

const NEW_ODATA_ROLES = ['S4_MM_DEMO', 'S4_SD_DEMO', 'S4_PM_DEMO'];

export async function registrarAlumno(
  username: string,
  roleId: string
): Promise<{ success: boolean; message: string; requiresFiori: boolean; statusCode: number }> {
  const lowerUsername = username.toLowerCase();
  const fromDate = formatDate(new Date());
  const toDate = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  if (NEW_ODATA_ROLES.includes(roleId)) {
    return registrarNuevoOData(lowerUsername, roleId, fromDate, toDate);
  } else {
    return registrarOriginalOData(lowerUsername, roleId, fromDate, toDate);
  }
}

async function registrarNuevoOData(
  username: string,
  roleId: string,
  fromDate: string,
  toDate: string
): Promise<{ success: boolean; message: string; requiresFiori: boolean; statusCode: number }> {
  try {
    const tokenResponse = await sapClientNew.get(
      '/sap/opu/odata/sap/ZITS_ODATA_MAT_SRV',
      {
        headers: { 'X-CSRF-Token': 'Fetch' }
      }
    );

    const csrfToken = tokenResponse.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      throw new Error('Token no disponible');
    }

    const setCookie = tokenResponse.headers['set-cookie'];
    const cookiesArray = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
    const sessionCookie = cookiesArray.find(c => c.includes('SAP_SESSIONID'));
    const cookieValue = sessionCookie || cookiesArray[0];

    if (!cookieValue) {
      throw new Error('Sesion no disponible');
    }

    const putUrl = `${config.sap.odataMatUrl}/sap/opu/odata/sap/ZITS_ODATA_MAT_SRV/UserAssignRoleSet(Username='${username}')?sap-user=${config.sap.user}&sap-password=${config.sap.password}&sap-client=${config.sap.client}`;

    const payload = {
      Argname: roleId,
      Fromdat: fromDate,
      Todat: toDate
    };

    console.log('[SAP Nuevo] URL:', putUrl);
    console.log('[SAP Nuevo] Payload:', JSON.stringify(payload));

    const putResponse = await sapClientNew.put(
      putUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': cookieValue
        }
      }
    );

    return {
      success: true,
      message: 'Registro exitoso',
      requiresFiori: true,
      statusCode: 200
    };
  } catch (error: any) {
    console.error('[SAP Nuevo] Error:', error.message);
    console.error('[SAP Nuevo] Status:', error.response?.status);
    console.error('[SAP Nuevo] Response Data:', JSON.stringify(error.response?.data));

    return {
      success: false,
      message: 'Ocurrio un error al procesar el registro. Intenta nuevamente.',
      requiresFiori: true,
      statusCode: error.response?.status || 500
    };
  }
}

async function registrarOriginalOData(
  username: string,
  roleId: string,
  fromDate: string,
  toDate: string
): Promise<{ success: boolean; message: string; requiresFiori: boolean; statusCode: number }> {
  try {
    const tokenResponse = await sapClientOriginal.get(
      '/sap/opu/odata/sap/ZSGA_USER_ASSIGN_ROLE_300_SRV',
      {
        headers: { 'X-CSRF-Token': 'Fetch' }
      }
    );

    const csrfToken = tokenResponse.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      throw new Error('Token no disponible');
    }

    const setCookie = tokenResponse.headers['set-cookie'];
    const cookiesArray = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
    const sessionCookie = cookiesArray.find(c => c.includes('SAP_SESSIONID'));
    const cookieValue = sessionCookie || cookiesArray[0];

    if (!cookieValue) {
      throw new Error('Sesion no disponible');
    }

    const putUrl = `${config.sap.baseUrl}/sap/opu/odata/sap/ZSGA_USER_ASSIGN_ROLE_300_SRV/UserAssignRoleSet(Username='${username}')?sap-user=${config.sap.user}&sap-password=${config.sap.password}&sap-client=${config.sap.client}`;

    const payload = {
      Argname: roleId,
      Fromdat: fromDate,
      Todat: toDate
    };

    await sapClientOriginal.put(
      putUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Cookie': cookieValue
        }
      }
    );

    return {
      success: true,
      message: 'Registro exitoso',
      requiresFiori: false,
      statusCode: 200
    };
  } catch (error: any) {
    console.error('[SAP Original] Error:', error.message);

    return {
      success: false,
      message: 'Ocurrio un error al procesar el registro. Intenta nuevamente.',
      requiresFiori: false,
      statusCode: error.response?.status || 500
    };
  }
}
