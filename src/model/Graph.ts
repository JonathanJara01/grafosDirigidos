import { Edge } from './Edge';
import {
  DescubrimientoDFS,
  EntradaAdyacencia,
  GrupoPorGrado,
  ResultadoActualizacion,
  ResultadoAlcanzabilidad,
  ResultadoArista,
  ResultadoBFS,
  ResultadoDFS,
  ResultadoEliminacionVertice,
  ResultadoVertice,
  VisitaBFS,
} from './Resultados';
import { ROLES, Rol, Vertex } from './Vertex';

/**
 * Grafo dirigido de seguimiento entre usuarios, con lista de adyacencia.
 * Los identificadores se normalizan (sin espacios y en mayúsculas), por lo que "u01" y "U01" son el mismo usuario.
 * No permite vértices ni aristas duplicados, ni que un usuario se siga a sí mismo.
 */
export class Graph {
  private readonly vertices = new Map<string, Vertex>();
  /** Lista de adyacencia: id → ids de los usuarios a los que sigue (orden de inserción). */
  private readonly adyacencia = new Map<string, string[]>();

  // ───────────────────────────── CRUD de vértices ─────────────────────────────

  agregarVertice(id: string, nombre: string, rol: string): ResultadoVertice {
    const clave = Graph.normalizarId(id);
    const nombreLimpio = (nombre ?? '').trim();
    const rolNormalizado = Graph.normalizarRol(rol);

    if (clave === '') return { exito: false, id: clave, motivo: 'ID_VACIO' };
    if (nombreLimpio === '') return { exito: false, id: clave, motivo: 'NOMBRE_VACIO' };
    if (rolNormalizado === null) return { exito: false, id: clave, motivo: 'ROL_INVALIDO' };
    if (this.vertices.has(clave)) {
      return { exito: false, id: clave, motivo: 'DUPLICADO', vertice: this.copiar(this.vertices.get(clave)!) };
    }

    const vertice = new Vertex(clave, nombreLimpio, rolNormalizado);
    this.vertices.set(clave, vertice);
    this.adyacencia.set(clave, []);
    return { exito: true, id: clave, vertice: this.copiar(vertice) };
  }

  /** Elimina el usuario y todas sus aristas (las que salen y las que llegan a él). */
  eliminarVertice(id: string): ResultadoEliminacionVertice {
    const clave = Graph.normalizarId(id);
    if (clave === '') return { exito: false, id: clave, motivo: 'ID_VACIO', aristasEliminadas: [] };
    const vertice = this.vertices.get(clave);
    if (!vertice) return { exito: false, id: clave, motivo: 'NO_ENCONTRADO', aristasEliminadas: [] };

    const aristasEliminadas: Edge[] = [];
    for (const destino of this.adyacencia.get(clave)!) aristasEliminadas.push(new Edge(clave, destino));
    for (const [origen, destinos] of this.adyacencia) {
      if (origen !== clave && destinos.includes(clave)) {
        aristasEliminadas.push(new Edge(origen, clave));
        this.adyacencia.set(origen, destinos.filter((d) => d !== clave));
      }
    }

    this.adyacencia.delete(clave);
    this.vertices.delete(clave);
    return { exito: true, id: clave, vertice: this.copiar(vertice), aristasEliminadas };
  }

  /** Actualiza nombre y/o rol. Los campos omitidos (undefined) no se modifican. */
  actualizarVertice(id: string, cambios: { nombre?: string; rol?: string }): ResultadoActualizacion {
    const clave = Graph.normalizarId(id);
    if (clave === '') return { exito: false, id: clave, motivo: 'ID_VACIO' };
    const vertice = this.vertices.get(clave);
    if (!vertice) return { exito: false, id: clave, motivo: 'NO_ENCONTRADO' };
    if (cambios.nombre === undefined && cambios.rol === undefined) {
      return { exito: false, id: clave, motivo: 'SIN_CAMBIOS' };
    }

    let nuevoNombre = vertice.nombre;
    if (cambios.nombre !== undefined) {
      nuevoNombre = cambios.nombre.trim();
      if (nuevoNombre === '') return { exito: false, id: clave, motivo: 'NOMBRE_VACIO' };
    }
    let nuevoRol: Rol = vertice.rol;
    if (cambios.rol !== undefined) {
      const rolNormalizado = Graph.normalizarRol(cambios.rol);
      if (rolNormalizado === null) return { exito: false, id: clave, motivo: 'ROL_INVALIDO' };
      nuevoRol = rolNormalizado;
    }

    const antes = { nombre: vertice.nombre, rol: vertice.rol };
    vertice.nombre = nuevoNombre;
    vertice.rol = nuevoRol;
    return { exito: true, id: clave, antes, despues: { nombre: vertice.nombre, rol: vertice.rol } };
  }

  // ───────────────────────────── CRUD de aristas ─────────────────────────────

  /** `origen` pasa a seguir a `destino`. */
  agregarArista(origen: string, destino: string): ResultadoArista {
    const o = Graph.normalizarId(origen);
    const d = Graph.normalizarId(destino);
    if (o === '' || d === '') return { exito: false, origen: o, destino: d, motivo: 'ID_VACIO' };
    if (!this.vertices.has(o)) return { exito: false, origen: o, destino: d, motivo: 'ORIGEN_NO_EXISTE' };
    if (!this.vertices.has(d)) return { exito: false, origen: o, destino: d, motivo: 'DESTINO_NO_EXISTE' };
    if (o === d) return { exito: false, origen: o, destino: d, motivo: 'AUTOSEGUIMIENTO' };

    const siguiendo = this.adyacencia.get(o)!;
    if (siguiendo.includes(d)) return { exito: false, origen: o, destino: d, motivo: 'DUPLICADA' };

    siguiendo.push(d);
    return { exito: true, origen: o, destino: d };
  }

  eliminarArista(origen: string, destino: string): ResultadoArista {
    const o = Graph.normalizarId(origen);
    const d = Graph.normalizarId(destino);
    if (o === '' || d === '') return { exito: false, origen: o, destino: d, motivo: 'ID_VACIO' };

    const siguiendo = this.adyacencia.get(o);
    if (!siguiendo || !siguiendo.includes(d)) return { exito: false, origen: o, destino: d, motivo: 'NO_EXISTE' };

    this.adyacencia.set(o, siguiendo.filter((x) => x !== d));
    return { exito: true, origen: o, destino: d };
  }

  // ───────────────────────────── Recorridos ─────────────────────────────

  /** BFS con cola desde `inicio`: orden de visita y distancia (en aristas) a cada alcanzado. */
  bfs(inicio: string): ResultadoBFS {
    const clave = Graph.normalizarId(inicio);
    if (!this.vertices.has(clave)) return { existe: false, inicio: clave, visitados: [] };

    const distancia = new Map<string, number>([[clave, 0]]);
    const cola: string[] = [clave];
    const visitados: VisitaBFS[] = [];
    let frente = 0; // índice de frente: evita el costo O(n) de Array.shift()

    while (frente < cola.length) {
      const actual = cola[frente++];
      const dist = distancia.get(actual)!;
      visitados.push({ vertice: this.copiar(this.vertices.get(actual)!), distancia: dist });
      for (const vecino of this.adyacencia.get(actual)!) {
        if (!distancia.has(vecino)) {
          distancia.set(vecino, dist + 1);
          cola.push(vecino);
        }
      }
    }
    return { existe: true, inicio: clave, visitados };
  }

  /**
   * DFS completo (bosque DFS) con colores blanco/gris/negro. Una arista hacia un vértice gris
   * (en la pila de recursión actual) es de retroceso y revela un ciclo dirigido.
   * Reporta un ciclo por arista de retroceso; no enumera todos los ciclos simples.
   */
  dfs(): ResultadoDFS {
    const BLANCO = 0, GRIS = 1, NEGRO = 2;
    const color = new Map<string, number>();
    const descubrimiento = new Map<string, number>();
    const finalizacion = new Map<string, number>();
    const ordenDescubrimiento: string[] = [];
    const raices: string[] = [];
    const ciclos: string[][] = [];
    const pila: string[] = [];
    let tiempo = 0;

    const visitar = (u: string): void => {
      color.set(u, GRIS);
      descubrimiento.set(u, ++tiempo);
      ordenDescubrimiento.push(u);
      pila.push(u);

      for (const v of this.adyacencia.get(u)!) {
        const c = color.get(v) ?? BLANCO;
        if (c === BLANCO) {
          visitar(v);
        } else if (c === GRIS) {
          ciclos.push([...pila.slice(pila.indexOf(v)), v]);
        }
      }

      pila.pop();
      color.set(u, NEGRO);
      finalizacion.set(u, ++tiempo);
    };

    for (const id of this.vertices.keys()) {
      if ((color.get(id) ?? BLANCO) === BLANCO) {
        raices.push(id);
        visitar(id);
      }
    }

    const entradas: DescubrimientoDFS[] = ordenDescubrimiento.map((id) => ({
      vertice: this.copiar(this.vertices.get(id)!),
      descubrimiento: descubrimiento.get(id)!,
      finalizacion: finalizacion.get(id)!,
    }));
    return { entradas, raices, ciclos };
  }

  /** ¿Puede `origen` llegar a `destino` siguiendo aristas dirigidas? Usa BFS con registro de padres. */
  puedeLlegar(origen: string, destino: string): ResultadoAlcanzabilidad {
    const o = Graph.normalizarId(origen);
    const d = Graph.normalizarId(destino);
    if (!this.vertices.has(o) || !this.vertices.has(d)) {
      return { valido: false, origen: o, destino: d, alcanzable: false, camino: [] };
    }

    const padre = new Map<string, string | null>([[o, null]]);
    const cola: string[] = [o];
    let frente = 0;
    while (frente < cola.length && !padre.has(d)) {
      const actual = cola[frente++];
      for (const vecino of this.adyacencia.get(actual)!) {
        if (!padre.has(vecino)) {
          padre.set(vecino, actual);
          cola.push(vecino);
        }
      }
    }

    if (!padre.has(d)) return { valido: true, origen: o, destino: d, alcanzable: false, camino: [] };

    const camino: string[] = [];
    for (let nodo: string | null = d; nodo !== null; nodo = padre.get(nodo) ?? null) camino.unshift(nodo);
    return { valido: true, origen: o, destino: d, alcanzable: true, camino };
  }

  // ───────────────────────────── Consultas sociales ─────────────────────────────

  /** Usuarios con grado de entrada 0 (nadie los sigue). */
  usuariosSinSeguidores(): Vertex[] {
    return [...this.vertices.values()].filter((v) => this.gradoEntrada(v.id) === 0).map((v) => this.copiar(v));
  }

  /** Usuarios con el mayor grado de entrada (más seguidores); incluye empates. */
  masInfluyentes(): GrupoPorGrado {
    return this.maximoPor((id) => this.gradoEntrada(id));
  }

  /** Usuarios con el mayor grado de salida (siguen a más personas); incluye empates. */
  masActivos(): GrupoPorGrado {
    return this.maximoPor((id) => this.gradoSalida(id));
  }

  gradoEntrada(id: string): number {
    const clave = Graph.normalizarId(id);
    let grado = 0;
    for (const destinos of this.adyacencia.values()) if (destinos.includes(clave)) grado++;
    return grado;
  }

  gradoSalida(id: string): number {
    return this.adyacencia.get(Graph.normalizarId(id))?.length ?? 0;
  }

  // ───────────────────────────── Estructura y métricas ─────────────────────────────

  /** Lista de adyacencia lista para presentar (copias, sin exponer el estado interno). */
  listaAdyacencia(): EntradaAdyacencia[] {
    return [...this.vertices.values()].map((v) => ({
      vertice: this.copiar(v),
      gradoEntrada: this.gradoEntrada(v.id),
      gradoSalida: this.gradoSalida(v.id),
      siguiendo: this.adyacencia.get(v.id)!.map((d) => this.copiar(this.vertices.get(d)!)),
    }));
  }

  cantidadVertices(): number {
    return this.vertices.size;
  }

  cantidadAristas(): number {
    let total = 0;
    for (const destinos of this.adyacencia.values()) total += destinos.length;
    return total;
  }

  /** Aristas existentes / aristas posibles en un grafo dirigido sin lazos: m / (n·(n−1)). */
  densidad(): number {
    const n = this.vertices.size;
    return n < 2 ? 0 : this.cantidadAristas() / (n * (n - 1));
  }

  /** Cantidad de relaciones recíprocas (A sigue a B y B sigue a A), contando cada pareja una vez. */
  relacionesReciprocas(): number {
    let total = 0;
    for (const [origen, destinos] of this.adyacencia) {
      for (const destino of destinos) {
        if (origen < destino && this.adyacencia.get(destino)!.includes(origen)) total++;
      }
    }
    return total;
  }

  /** Componentes fuertemente conexas (Kosaraju): grupos donde todos se alcanzan entre sí. */
  componentesFuertementeConexas(): Vertex[][] {
    const visitado = new Set<string>();
    const orden: string[] = [];
    const primeraPasada = (u: string): void => {
      visitado.add(u);
      for (const v of this.adyacencia.get(u)!) if (!visitado.has(v)) primeraPasada(v);
      orden.push(u);
    };
    for (const id of this.vertices.keys()) if (!visitado.has(id)) primeraPasada(id);

    const transpuesto = new Map<string, string[]>();
    for (const id of this.vertices.keys()) transpuesto.set(id, []);
    for (const [origen, destinos] of this.adyacencia) {
      for (const destino of destinos) transpuesto.get(destino)!.push(origen);
    }

    const asignado = new Set<string>();
    const componentes: Vertex[][] = [];
    for (const raiz of orden.reverse()) {
      if (asignado.has(raiz)) continue;
      const ids: string[] = [];
      const segundaPasada = (u: string): void => {
        asignado.add(u);
        ids.push(u);
        for (const v of transpuesto.get(u)!) if (!asignado.has(v)) segundaPasada(v);
      };
      segundaPasada(raiz);
      componentes.push(ids.sort().map((id) => this.copiar(this.vertices.get(id)!)));
    }
    return componentes;
  }

  // ───────────────────────────── Auxiliares ─────────────────────────────

  private maximoPor(grado: (id: string) => number): GrupoPorGrado {
    let maximo = -1;
    let usuarios: Vertex[] = [];
    for (const v of this.vertices.values()) {
      const g = grado(v.id);
      if (g > maximo) {
        maximo = g;
        usuarios = [this.copiar(v)];
      } else if (g === maximo) {
        usuarios.push(this.copiar(v));
      }
    }
    return { grado: Math.max(maximo, 0), usuarios };
  }

  private copiar(v: Vertex): Vertex {
    return new Vertex(v.id, v.nombre, v.rol);
  }

  private static normalizarId(id: string): string {
    return (id ?? '').trim().toUpperCase();
  }

  private static normalizarRol(rol: string): Rol | null {
    const r = (rol ?? '').trim().toLowerCase();
    return (ROLES as readonly string[]).includes(r) ? (r as Rol) : null;
  }
}
