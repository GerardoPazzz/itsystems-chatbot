import { readFileSync } from 'fs';
import { resolve } from 'path';

interface CursoCatalogo {
  id: string;
  nombre: string;
  modalidad?: string;
  segmento?: string;
  duracion?: string;
}

interface Catalogo {
  cursos: CursoCatalogo[];
  perfiles: unknown[];
}

describe('Catalogo de cursos - campo duracion', () => {

  const catalogo: Catalogo = JSON.parse(
    readFileSync(resolve(process.cwd(), 'frontend', 'catalogo_cursos.json'), 'utf8')
  );

  it('debe tener al menos un curso en el catalogo', () => {
    expect(catalogo.cursos.length).toBeGreaterThan(0);
  });

  it('debe tener duracion en todos los cursos', () => {
    const sinDuracion = catalogo.cursos
      .filter(curso => !curso.duracion)
      .map(curso => `${curso.id} (${curso.nombre})`);

    expect(sinDuracion).toEqual([]);
  });

  it('debe tener la duracion con el formato "N horas"', () => {
    const formatoInvalido = catalogo.cursos
      .filter(curso => !/^\d+(\.\d+)? horas$/.test(curso.duracion || ''))
      .map(curso => `${curso.id}: "${curso.duracion}"`);

    expect(formatoInvalido).toEqual([]);
  });

  it('no debe tener duraciones duplicadas para el mismo id', () => {
    const ids = catalogo.cursos.map(curso => curso.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('debe tener duraciones coherentes con la distribucion acordada', () => {
    const porValor: Record<string, number> = {};
    catalogo.cursos.forEach(curso => {
      porValor[curso.duracion || ''] = (porValor[curso.duracion || ''] || 0) + 1;
    });

    expect(porValor['4 horas']).toBe(1);
    expect(porValor['12 horas']).toBe(1);
    expect(porValor['15 horas']).toBe(1);
    expect(porValor['20 horas']).toBe(3);
    expect(porValor['24 horas']).toBe(2);
    expect(porValor['25 horas']).toBe(2);
    expect(porValor['30 horas']).toBe(44);
  });

  it('debe tener 25 horas en los cursos ABAP RAP', () => {
    const abapRap = catalogo.cursos.filter(curso => curso.id.includes('abap-rap'));
    expect(abapRap.length).toBe(2);
    abapRap.forEach(curso => expect(curso.duracion).toBe('25 horas'));
  });

  it('debe tener 30 horas en los cursos ABAP', () => {
    const abap = catalogo.cursos.filter(curso => /abap-(online|virtual)$/.test(curso.id));
    expect(abap.length).toBe(2);
    abap.forEach(curso => expect(curso.duracion).toBe('30 horas'));
  });

  it('debe tener 30 horas en los 5 cursos de SAP Business One', () => {
    const sbo = catalogo.cursos.filter(curso => curso.id.startsWith('sbo-'));
    expect(sbo.length).toBe(5);
    sbo.forEach(curso => expect(curso.duracion).toBe('30 horas'));
  });

  it('debe tener 30 horas en los modulos MM, PP, SD, FI, CO y PM', () => {
    const modulos = ['mm', 'pp', 'sd', 'fi', 'co', 'pm'];
    const cursosModulo = catalogo.cursos.filter(curso =>
      // MM Configuracion tiene 20 horas por decision explicita.
      !curso.id.includes('configuracion') &&
      modulos.some(mod => new RegExp(`(^|-)${mod}-`).test(curso.id))
    );

    expect(cursosModulo.length).toBeGreaterThan(0);
    cursosModulo.forEach(curso => expect(curso.duracion).toBe('30 horas'));
  });

  it('debe tener 20 horas en MM Configuracion y Fiori', () => {
    const con20 = catalogo.cursos.filter(curso => curso.duracion === '20 horas');
    const ids = con20.map(curso => curso.id).sort();

    expect(ids).toEqual([
      'hana-fiori-online',
      'hana-fiori-virtual',
      's4hana-mm-configuracion-online'
    ]);
  });
});
