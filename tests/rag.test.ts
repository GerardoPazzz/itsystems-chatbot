import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

const CATALOGO_PATH = resolve(process.cwd(), 'catalogo_cursos.json');
const SESIONES_PATH = resolve(process.cwd(), 'sesiones.json');

describe('RAG - Validadcion del Catalogo de Cursos', () => {

  describe('testCatalogoExiste', () => {
    it('debe existir el archivo catalogo_cursos.json', () => {
      expect(existsSync(CATALOGO_PATH)).toBe(true);
    });
  });

  describe('testCatalogoEstructuraValida', () => {
    it('debe ser un JSON valido con estructura de cursos', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo).toHaveProperty('cursos');
      expect(Array.isArray(catalogo.cursos)).toBe(true);
      expect(catalogo.cursos.length).toBeGreaterThan(0);
    });

    it('debe tener exactamente 5 cursos', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo.cursos).toHaveLength(5);
    });
  });

  describe('testCursoSAPFI', () => {
    it('debe tener SAP FI con duracion de 40 horas', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-fi');

      expect(curso).toBeDefined();
      expect(curso.nombre).toContain('SAP FI');
      expect(curso.duracion).toBe('40 horas');
    });

    it('debe tener modalidad virtual asincrona para SAP FI', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-fi');

      expect(curso.modalidad).toContain('Virtual');
    });

    it('debe tener modulos definidos para SAP FI', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-fi');

      expect(curso.modulos).toBeDefined();
      expect(Array.isArray(curso.modulos)).toBe(true);
      expect(curso.modulos.length).toBeGreaterThan(0);
    });

    it('debe tener nivel Intermedio para SAP FI', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-fi');

      expect(curso.nivel).toBe('Intermedio');
    });
  });

  describe('testCursoSAPMM', () => {
    it('debe tener SAP MM con duracion de 35 horas', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-mm');

      expect(curso).toBeDefined();
      expect(curso.nombre).toContain('SAP MM');
      expect(curso.duracion).toBe('35 horas');
    });
  });

  describe('testCursoSAPSD', () => {
    it('debe tener SAP SD con duracion de 35 horas', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-sd');

      expect(curso).toBeDefined();
      expect(curso.nombre).toContain('SAP SD');
      expect(curso.duracion).toBe('35 horas');
    });
  });

  describe('testCursoABAP', () => {
    it('debe tener SAP ABAP con duracion de 45 horas', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-abap');

      expect(curso).toBeDefined();
      expect(curso.nombre).toContain('ABAP');
      expect(curso.duracion).toBe('45 horas');
    });

    it('debe tener nivel Avanzado para SAP ABAP', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-abap');

      expect(curso.nivel).toBe('Avanzado');
    });
  });

  describe('testCursoCAP', () => {
    it('debe tener SAP CAP con duracion de 30 horas', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos.find((c: any) => c.id === 'sap-cap');

      expect(curso).toBeDefined();
      expect(curso.nombre).toContain('CAP');
      expect(curso.duracion).toBe('30 horas');
    });
  });

  describe('testPerfiles', () => {
    it('debe tener perfiles definidos', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo.perfiles).toBeDefined();
      expect(Array.isArray(catalogo.perfiles)).toBe(true);
      expect(catalogo.perfiles.length).toBeGreaterThan(0);
    });

    it('debe tener perfil Consultor Funcional', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-funcional');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('Consultor Funcional');
    });
  });

  describe('testInformacionGeneral', () => {
    it('debe tener informacion general del catalogo', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo.informacion_general).toBeDefined();
      expect(catalogo.informacion_general).toHaveProperty('metodologia');
      expect(catalogo.informacion_general).toHaveProperty('soporte');
      expect(catalogo.informacion_general).toHaveProperty('acceso');
    });
  });

  describe('testSesionesArchivo', () => {
    it('debe existir el archivo sesiones.json', () => {
      expect(existsSync(SESIONES_PATH)).toBe(true);
    });

    it('debe ser un JSON valido', async () => {
      const data = await readFile(SESIONES_PATH, 'utf-8');
      const sesiones = JSON.parse(data);

      expect(typeof sesiones).toBe('object');
      expect(sesiones).not.toBeNull();
    });
  });
});
