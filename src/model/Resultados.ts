import { Edge } from './Edge';
import { Vertex } from './Vertex';

/** Resultados que devuelve el Model para que la View los presente (el Model nunca imprime). */

export type MotivoVertice =
  | 'ID_VACIO'
  | 'NOMBRE_VACIO'
  | 'ROL_INVALIDO'
  | 'DUPLICADO'
  | 'NO_ENCONTRADO'
  | 'SIN_CAMBIOS';

export interface ResultadoVertice {
  exito: boolean;
  id: string;
  motivo?: MotivoVertice;
  /** Copia del usuario afectado (si la operación tuvo éxito o el usuario existe). */
  vertice?: Vertex;
}

export interface ResultadoEliminacionVertice {
  exito: boolean;
  id: string;
  motivo?: 'ID_VACIO' | 'NO_ENCONTRADO';
  vertice?: Vertex;
  /** Aristas que se eliminaron junto con el usuario (salientes y entrantes). */
  aristasEliminadas: Edge[];
}

export type MotivoArista =
  | 'ID_VACIO'
  | 'ORIGEN_NO_EXISTE'
  | 'DESTINO_NO_EXISTE'
  | 'AUTOSEGUIMIENTO'
  | 'DUPLICADA'
  | 'NO_EXISTE';

export interface ResultadoArista {
  exito: boolean;
  origen: string;
  destino: string;
  motivo?: MotivoArista;
}

export interface InstantaneaUsuario {
  nombre: string;
  rol: string;
}

export interface ResultadoActualizacion {
  exito: boolean;
  id: string;
  motivo?: MotivoVertice;
  antes?: InstantaneaUsuario;
  despues?: InstantaneaUsuario;
}

// ───────────── Recorridos ─────────────

export interface VisitaBFS {
  vertice: Vertex;
  /** Número de aristas desde el origen. */
  distancia: number;
}

export interface ResultadoBFS {
  existe: boolean;
  inicio: string;
  /** Orden de visita (incluye el origen). */
  visitados: VisitaBFS[];
}

export interface DescubrimientoDFS {
  vertice: Vertex;
  descubrimiento: number;
  finalizacion: number;
}

export interface ResultadoDFS {
  /** Vértices en orden de descubrimiento. */
  entradas: DescubrimientoDFS[];
  /** Raíz de cada árbol del bosque DFS. */
  raices: string[];
  /** Un ciclo por cada arista de retroceso; cada ciclo repite el primer id al final (A → B → C → A). */
  ciclos: string[][];
}

export interface ResultadoAlcanzabilidad {
  valido: boolean;
  origen: string;
  destino: string;
  alcanzable: boolean;
  /** Camino más corto (en aristas) encontrado por BFS; vacío si no es alcanzable. */
  camino: string[];
}

// ───────────── Consultas y métricas ─────────────

export interface EntradaAdyacencia {
  vertice: Vertex;
  gradoEntrada: number;
  gradoSalida: number;
  /** Usuarios a los que sigue, en orden de inserción de la relación. */
  siguiendo: Vertex[];
}

export interface GrupoPorGrado {
  grado: number;
  usuarios: Vertex[];
}
