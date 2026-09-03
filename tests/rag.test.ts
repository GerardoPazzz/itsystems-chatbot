import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

const CATALOGO_PATH = resolve(process.cwd(), 'catalogo_cursos.json');
const SESIONES_PATH = resolve(process.cwd(), 'sesiones.json');

describe('RAG - Validacion del Catalogo de Cursos', () => {

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

    it('debe tener 38 cursos', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo.cursos).toHaveLength(38);
    });

    it('debe tener la estructura correcta de curso con segmento', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const curso = catalogo.cursos[0];
      expect(curso).toHaveProperty('id');
      expect(curso).toHaveProperty('nombre');
      expect(curso).toHaveProperty('segmento');
      expect(curso).toHaveProperty('modalidad');
      expect(curso).toHaveProperty('precio');
      expect(curso).toHaveProperty('recursos');
      expect(curso).toHaveProperty('dirigido');
      expect(curso).toHaveProperty('habilidades_adquiridas');
    });

    it('debe tener descripcion en cada curso', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      catalogo.cursos.forEach((curso: any) => {
        expect(curso.descripcion).toBeDefined();
        expect(typeof curso.descripcion).toBe('string');
        expect(curso.descripcion.length).toBeGreaterThan(0);
      });
    });

    it('debe tener prerrequisitos_recomendados en cada curso', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      catalogo.cursos.forEach((curso: any) => {
        expect(curso.prerrequisitos_recomendados).toBeDefined();
        expect(Array.isArray(curso.prerrequisitos_recomendados)).toBe(true);
      });
    });
  });

  describe('testSegmentos', () => {
    it('debe tener cursos del segmento SBO', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosSBO = catalogo.cursos.filter((c: any) => c.segmento === 'SBO');
      expect(cursosSBO.length).toBeGreaterThan(0);
    });

    it('debe tener cursos del segmento S4 HANA', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosS4HANA = catalogo.cursos.filter((c: any) => c.segmento === 'S4 HANA');
      expect(cursosS4HANA.length).toBeGreaterThan(0);
    });

    it('debe tener cursos del segmento ECC', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosECC = catalogo.cursos.filter((c: any) => c.segmento === 'ECC');
      expect(cursosECC.length).toBeGreaterThan(0);
    });

    it('debe tener cursos del segmento HANA TECNICO', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosHANA = catalogo.cursos.filter((c: any) => c.segmento === 'HANA TECNICO');
      expect(cursosHANA.length).toBeGreaterThan(0);
    });

    it('debe tener cursos del segmento PRODUCTIVIDAD', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosProductividad = catalogo.cursos.filter((c: any) => c.segmento === 'PRODUCTIVIDAD');
      expect(cursosProductividad.length).toBeGreaterThan(0);
    });
  });

  describe('testModalidades', () => {
    it('debe tener cursos con modalidad VIRTUAL', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosVirtual = catalogo.cursos.filter((c: any) => c.modalidad === 'VIRTUAL');
      expect(cursosVirtual.length).toBeGreaterThan(0);
    });

    it('debe tener cursos con modalidad ONLINE', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const cursosOnline = catalogo.cursos.filter((c: any) => c.modalidad === 'ONLINE');
      expect(cursosOnline.length).toBeGreaterThan(0);
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

    it('debe tener 14 perfiles', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      expect(catalogo.perfiles).toHaveLength(14);
    });

    it('debe tener perfil consultor-sbo', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-sbo');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('SAP Business One');
    });

    it('debe tener perfil consultor-s4hana', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-s4hana');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('S/4HANA');
    });

    it('debe tener perfil desarrollador-hana-online', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'desarrollador-hana-online');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('Desarrollador');
    });

    it('debe tener perfil administrador-hana-virtual', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'administrador-hana-virtual');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('Administrador');
    });

    it('debe tener perfil consultor-ecc', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-ecc');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('ECC');
    });

    it('debe tener perfil consultor-productividad', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-productividad');

      expect(perfil).toBeDefined();
      expect(perfil.nombre).toContain('Productividad');
    });

    it('debe tener perfil consultor-tecnico-hibrido', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-tecnico-hibrido');

      expect(perfil).toBeDefined();
    });

    it('debe tener perfil consultor-datos-empresariales', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-datos-empresariales');

      expect(perfil).toBeDefined();
    });

    it('debe tener perfil consultor-automation-ai', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      const perfil = catalogo.perfiles.find((p: any) => p.id === 'consultor-automation-ai');

      expect(perfil).toBeDefined();
    });

    it('cada perfil debe tener ruta_sugerida y justificacion', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      catalogo.perfiles.forEach((perfil: any) => {
        expect(perfil).toHaveProperty('ruta_sugerida');
        expect(perfil).toHaveProperty('justificacion_ruta');
        expect(Array.isArray(perfil.ruta_sugerida)).toBe(true);
        expect(perfil.ruta_sugerida.length).toBeGreaterThan(0);
      });
    });

    it('cada perfil debe tener al menos un curso obligatorio', async () => {
      const data = await readFile(CATALOGO_PATH, 'utf-8');
      const catalogo = JSON.parse(data);

      catalogo.perfiles.forEach((perfil: any) => {
        expect(perfil).toHaveProperty('cursos_obligatorios');
        expect(Array.isArray(perfil.cursos_obligatorios)).toBe(true);
        expect(perfil.cursos_obligatorios.length).toBeGreaterThan(0);
      });
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
