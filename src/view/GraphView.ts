import { Vertex } from '../model/Vertex';
import {
  EntradaAdyacencia,
  GrupoPorGrado,
  ResultadoActualizacion,
  ResultadoAlcanzabilidad,
  ResultadoArista,
  ResultadoBFS,
  ResultadoDFS,
  ResultadoEliminacionVertice,
  ResultadoVertice,
} from '../model/Resultados';

/** Presentación en consola. Solo formatea e imprime; no contiene lógica del grafo. */
export class GraphView {
  private static readonly ANCHO = 76;

  // ───────────────────────────── Estructura ─────────────────────────────

  mostrarEncabezado(titulo: string): void {
    const linea = '═'.repeat(GraphView.ANCHO);
    console.log(`\n${linea}\n  ${titulo}\n${linea}`);
  }

  mostrarSubencabezado(titulo: string): void {
    console.log(`\n── ${titulo} ${'─'.repeat(Math.max(3, GraphView.ANCHO - titulo.length - 4))}`);
  }

  mostrarMensaje(texto: string): void {
    console.log(`  ${texto}`);
  }

  mostrarSeparador(): void {
    console.log('');
  }

  /** Lista de adyacencia: "A → B, C" significa que A sigue a B y a C. */
  mostrarListaAdyacencia(entradas: EntradaAdyacencia[], titulo = 'Lista de adyacencia'): void {
    console.log(`\n  ${titulo}  (A → B: A sigue a B | sal = sigue a, ent = seguidores)`);
    if (entradas.length === 0) {
      console.log('  (grafo vacío)');
      return;
    }
    for (const e of entradas) {
      const cabecera = `${this.etiqueta(e.vertice)}  [sal ${e.gradoSalida} | ent ${e.gradoEntrada}]`;
      const destinos = e.siguiendo.length > 0 ? e.siguiendo.map((v) => v.id).join(', ') : '(no sigue a nadie)';
      console.log(`  ${cabecera}\n      → ${destinos}`);
    }
  }

  // ───────────────────────────── CRUD ─────────────────────────────

  mostrarUsuarioAgregado(r: ResultadoVertice): void {
    if (r.exito && r.vertice) {
      this.mostrarMensaje(`✔ Usuario agregado: ${this.etiqueta(r.vertice)}`);
      return;
    }
    const razones: Record<string, string> = {
      ID_VACIO: 'el id no puede estar vacío',
      NOMBRE_VACIO: 'el nombre no puede estar vacío',
      ROL_INVALIDO: 'el rol debe ser estudiante, profesor o egresado',
      DUPLICADO: `el id ya existe (${r.vertice ? this.etiqueta(r.vertice) : r.id})`,
    };
    this.mostrarMensaje(`✖ Usuario "${r.id}" rechazado: ${razones[r.motivo ?? 'ID_VACIO']}`);
  }

  mostrarUsuarioEliminado(r: ResultadoEliminacionVertice): void {
    if (!r.exito || !r.vertice) {
      this.mostrarMensaje(`✖ No se eliminó "${r.id}": ${r.motivo === 'ID_VACIO' ? 'id vacío' : 'el usuario no existe'}`);
      return;
    }
    this.mostrarMensaje(`✔ Usuario eliminado: ${this.etiqueta(r.vertice)}`);
    if (r.aristasEliminadas.length === 0) {
      this.mostrarMensaje('  No tenía relaciones.');
      return;
    }
    this.mostrarMensaje(`  Relaciones eliminadas con él (${r.aristasEliminadas.length}):`);
    for (const a of r.aristasEliminadas) this.mostrarMensaje(`    ${a.origen} → ${a.destino}`);
  }

  mostrarRelacionAgregada(r: ResultadoArista): void {
    if (r.exito) {
      this.mostrarMensaje(`✔ Relación agregada: ${r.origen} → ${r.destino}`);
      return;
    }
    this.mostrarMensaje(`✖ Relación ${r.origen} → ${r.destino} rechazada: ${this.razonArista(r)}`);
  }

  mostrarRelacionEliminada(r: ResultadoArista): void {
    if (r.exito) {
      this.mostrarMensaje(`✔ Relación eliminada: ${r.origen} → ${r.destino}`);
      return;
    }
    this.mostrarMensaje(`✖ No se eliminó ${r.origen} → ${r.destino}: ${this.razonArista(r)}`);
  }

  mostrarActualizacion(r: ResultadoActualizacion): void {
    if (!r.exito || !r.antes || !r.despues) {
      const razones: Record<string, string> = {
        ID_VACIO: 'el id no puede estar vacío',
        NO_ENCONTRADO: 'el usuario no existe',
        SIN_CAMBIOS: 'no se indicó ningún cambio',
        NOMBRE_VACIO: 'el nombre no puede estar vacío',
        ROL_INVALIDO: 'el rol debe ser estudiante, profesor o egresado',
      };
      this.mostrarMensaje(`✖ No se actualizó "${r.id}": ${razones[r.motivo ?? 'NO_ENCONTRADO']}`);
      return;
    }
    this.mostrarMensaje(`✔ Usuario ${r.id} actualizado:`);
    if (r.antes.nombre !== r.despues.nombre) {
      this.mostrarMensaje(`    nombre: "${r.antes.nombre}" → "${r.despues.nombre}"`);
    }
    if (r.antes.rol !== r.despues.rol) {
      this.mostrarMensaje(`    rol   : ${r.antes.rol} → ${r.despues.rol}`);
    }
  }

  // ───────────────────────────── Recorridos ─────────────────────────────

  mostrarBFS(r: ResultadoBFS): void {
    if (!r.existe) {
      this.mostrarMensaje(`✖ BFS: el usuario "${r.inicio}" no existe`);
      return;
    }
    this.mostrarMensaje(`BFS desde ${r.inicio}`);
    this.mostrarMensaje(`  Orden de visita : ${r.visitados.map((v) => v.vertice.id).join(' → ')}`);
    const niveles = new Map<number, string[]>();
    for (const v of r.visitados) niveles.set(v.distancia, [...(niveles.get(v.distancia) ?? []), v.vertice.id]);
    for (const [nivel, ids] of niveles) this.mostrarMensaje(`  Distancia ${nivel}     : ${ids.join(', ')}`);
    this.mostrarMensaje(
      `  Vértices alcanzados: ${r.visitados.length} (incluye el origen; ${r.visitados.length - 1} además de ${r.inicio})`,
    );
  }

  mostrarDFS(r: ResultadoDFS): void {
    this.mostrarMensaje(`Orden de descubrimiento: ${r.entradas.map((e) => e.vertice.id).join(' → ')}`);
    this.mostrarMensaje(`Tiempos (descubrimiento/finalización):`);
    this.mostrarMensaje(
      '  ' + r.entradas.map((e) => `${e.vertice.id} ${e.descubrimiento}/${e.finalizacion}`).join(' | '),
    );
    this.mostrarMensaje(`Árboles del bosque DFS: ${r.raices.length} (raíces: ${r.raices.join(', ')})`);
    this.mostrarCiclos(r.ciclos);
  }

  mostrarCiclos(ciclos: string[][]): void {
    if (ciclos.length === 0) {
      this.mostrarMensaje('Ciclos dirigidos: ninguno (el grafo es acíclico)');
      return;
    }
    this.mostrarMensaje(`Ciclos dirigidos detectados por aristas de retroceso: ${ciclos.length}`);
    ciclos.forEach((c, i) => this.mostrarMensaje(`  ${i + 1}. ${c.join(' → ')}`));
  }

  mostrarAlcanzabilidad(r: ResultadoAlcanzabilidad): void {
    if (!r.valido) {
      this.mostrarMensaje(`✖ ${r.origen} → ${r.destino}: alguno de los usuarios no existe`);
    } else if (r.alcanzable) {
      this.mostrarMensaje(
        `✔ ${r.origen} SÍ puede llegar a ${r.destino} (${r.camino.length - 1} saltos): ${r.camino.join(' → ')}`,
      );
    } else {
      this.mostrarMensaje(`✖ ${r.origen} NO puede llegar a ${r.destino}`);
    }
  }

  // ───────────────────────────── Consultas y métricas ─────────────────────────────

  mostrarUsuarios(titulo: string, usuarios: Vertex[]): void {
    this.mostrarMensaje(`${titulo}: ${usuarios.length}`);
    for (const u of usuarios) this.mostrarMensaje(`  • ${this.etiqueta(u)}`);
  }

  mostrarGrupoPorGrado(titulo: string, unidad: string, grupo: GrupoPorGrado): void {
    this.mostrarMensaje(`${titulo} — ${grupo.grado} ${unidad}:`);
    for (const u of grupo.usuarios) this.mostrarMensaje(`  • ${this.etiqueta(u)}`);
  }

  mostrarComponentes(componentes: Vertex[][]): void {
    this.mostrarMensaje(`Componentes fuertemente conexas: ${componentes.length}`);
    const grandes = componentes.filter((c) => c.length > 1);
    for (const c of grandes) this.mostrarMensaje(`  • {${c.map((v) => v.id).join(', ')}}  (todos se alcanzan entre sí)`);
    const sueltos = componentes.length - grandes.length;
    this.mostrarMensaje(`  Usuarios que forman una componente por sí solos: ${sueltos}`);
  }

  mostrarMetrica(nombre: string, valor: string | number): void {
    this.mostrarMensaje(`${nombre.padEnd(34)}: ${valor}`);
  }

  // ───────────────────────────── Auxiliares ─────────────────────────────

  private etiqueta(v: Vertex): string {
    return `${v.id} ${v.nombre} (${v.rol})`;
  }

  private razonArista(r: ResultadoArista): string {
    const razones: Record<string, string> = {
      ID_VACIO: 'el id no puede estar vacío',
      ORIGEN_NO_EXISTE: `el usuario ${r.origen} no existe`,
      DESTINO_NO_EXISTE: `el usuario ${r.destino} no existe`,
      AUTOSEGUIMIENTO: 'un usuario no puede seguirse a sí mismo',
      DUPLICADA: 'la relación ya existe (no se permiten aristas duplicadas)',
      NO_EXISTE: 'la relación no existe',
    };
    return razones[r.motivo ?? 'NO_EXISTE'];
  }
}
