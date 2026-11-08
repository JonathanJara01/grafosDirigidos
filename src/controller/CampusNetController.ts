import { Graph } from '../model/Graph';
import { GraphView } from '../view/GraphView';

/**
 * Orquesta los casos de uso del taller en orden. No contiene lógica del grafo:
 * delega en el Model y entrega los resultados a la View.
 */
export class CampusNetController {
  private static readonly USUARIOS: ReadonlyArray<readonly [string, string, string]> = [
    ['U01', 'Ana Torres', 'profesor'],
    ['U02', 'Bruno Díaz', 'estudiante'],
    ['U03', 'Carla Gómez', 'estudiante'],
    ['U04', 'Diego Ruiz', 'egresado'],
    ['U05', 'Elena Vargas', 'profesor'],
    ['U06', 'Felipe Rojas', 'estudiante'],
    ['U07', 'Gabriela Soto', 'egresado'],
    ['U08', 'Hugo Marín', 'estudiante'],
    ['U09', 'Irene Castaño', 'profesor'],
    ['U10', 'Julián Prada', 'estudiante'],
    ['U11', 'Karen Ospina', 'egresado'],
    ['U12', 'Luis Mejía', 'estudiante'],
  ];

  /** [A, B] significa que A sigue a B. */
  private static readonly RELACIONES: ReadonlyArray<readonly [string, string]> = [
    ['U01', 'U02'], ['U01', 'U03'], ['U01', 'U05'], ['U01', 'U09'], // U01 sigue a 4
    ['U02', 'U03'], ['U02', 'U05'], ['U02', 'U09'], ['U02', 'U01'], // U02 sigue a 4 (y U01↔U02 son recíprocos)
    ['U03', 'U04'], ['U03', 'U05'],
    ['U04', 'U02'], ['U04', 'U07'], // ciclo: U02 → U03 → U04 → U02
    ['U05', 'U09'], ['U05', 'U07'],
    ['U06', 'U05'], ['U06', 'U09'], ['U06', 'U07'], ['U06', 'U08'], // U06 sigue a 4; nadie sigue a U06
    ['U07', 'U11'],
    ['U08', 'U09'], ['U08', 'U10'],
    ['U09', 'U11'],
    ['U10', 'U11'],
    ['U12', 'U01'], ['U12', 'U05'], // nadie sigue a U12
  ];

  private static readonly ORIGENES_BFS = ['U01', 'U06', 'U10'];

  private static readonly PARES_ALCANZABILIDAD: ReadonlyArray<readonly [string, string]> = [
    ['U12', 'U11'], // alcanzable con varios saltos
    ['U11', 'U01'], // no alcanzable (U11 no sigue a nadie)
    ['U04', 'U03'], // alcanzable gracias al ciclo
    ['U01', 'U99'], // usuario inexistente
  ];

  constructor(
    private readonly grafo: Graph,
    private readonly vista: GraphView,
  ) {}

  ejecutar(): void {
    this.construirGrafo();
    this.ejecutarRecorridos();
    this.ejecutarConsultas();
    this.ejecutarOperacionesCrud();
    this.mostrarAnalisisFinal();
  }

  // 1. Construcción del grafo
  private construirGrafo(): void {
    this.vista.mostrarEncabezado('CASO 1 · CONSTRUCCIÓN DEL GRAFO (CampusNet)');
    this.vista.mostrarMensaje('Grafo dirigido vacío creado.');

    this.vista.mostrarSubencabezado(`Usuarios (${CampusNetController.USUARIOS.length})`);
    for (const [id, nombre, rol] of CampusNetController.USUARIOS) {
      this.vista.mostrarUsuarioAgregado(this.grafo.agregarVertice(id, nombre, rol));
    }

    this.vista.mostrarSubencabezado(`Relaciones de seguimiento (${CampusNetController.RELACIONES.length})`);
    for (const [origen, destino] of CampusNetController.RELACIONES) {
      this.vista.mostrarRelacionAgregada(this.grafo.agregarArista(origen, destino));
    }

    this.vista.mostrarSubencabezado('Control de duplicados y validaciones (deben ser rechazados)');
    this.vista.mostrarUsuarioAgregado(this.grafo.agregarVertice('u01', 'Otra Persona', 'estudiante'));
    this.vista.mostrarUsuarioAgregado(this.grafo.agregarVertice('U50', 'Rol Inventado', 'decano'));
    this.vista.mostrarRelacionAgregada(this.grafo.agregarArista('U01', 'U02'));
    this.vista.mostrarRelacionAgregada(this.grafo.agregarArista('U03', 'U03'));
    this.vista.mostrarRelacionAgregada(this.grafo.agregarArista('U03', 'U99'));

    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia(), 'Estructura del grafo');
    this.vista.mostrarSubencabezado('Tamaño del grafo');
    this.vista.mostrarMetrica('Vértices (usuarios)', this.grafo.cantidadVertices());
    this.vista.mostrarMetrica('Aristas (relaciones)', this.grafo.cantidadAristas());
  }

  // 2. Recorridos
  private ejecutarRecorridos(): void {
    this.vista.mostrarEncabezado('CASO 2 · RECORRIDOS');

    this.vista.mostrarSubencabezado('BFS desde 3 usuarios distintos');
    for (const origen of CampusNetController.ORIGENES_BFS) {
      this.vista.mostrarBFS(this.grafo.bfs(origen));
      this.vista.mostrarSeparador();
    }

    this.vista.mostrarSubencabezado('DFS completo');
    this.vista.mostrarDFS(this.grafo.dfs());
  }

  // 3. Consultas sociales
  private ejecutarConsultas(): void {
    this.vista.mostrarEncabezado('CASO 3 · CONSULTAS SOCIALES');
    this.consultarRanking();

    this.vista.mostrarSubencabezado('Alcanzabilidad (BFS)');
    for (const [origen, destino] of CampusNetController.PARES_ALCANZABILIDAD) {
      this.vista.mostrarAlcanzabilidad(this.grafo.puedeLlegar(origen, destino));
    }
  }

  // 4. Operaciones CRUD (se imprime el grafo tras cada operación)
  private ejecutarOperacionesCrud(): void {
    this.vista.mostrarEncabezado('CASO 4 · OPERACIONES CRUD');

    this.vista.mostrarSubencabezado('Agregar usuario: U13 Marta León (estudiante)');
    this.vista.mostrarUsuarioAgregado(this.grafo.agregarVertice('U13', 'Marta León', 'estudiante'));
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia());

    this.vista.mostrarSubencabezado('Agregar relaciones: U13 → U01 y U13 → U12');
    this.vista.mostrarRelacionAgregada(this.grafo.agregarArista('U13', 'U01'));
    this.vista.mostrarRelacionAgregada(this.grafo.agregarArista('U13', 'U12'));
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia());

    this.vista.mostrarSubencabezado('Eliminar relación: U02 → U01');
    this.vista.mostrarRelacionEliminada(this.grafo.eliminarArista('U02', 'U01'));
    this.vista.mostrarRelacionEliminada(this.grafo.eliminarArista('U02', 'U01')); // ya no existe
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia());

    this.vista.mostrarSubencabezado('Actualizar usuario: U10 cambia de nombre y U12 cambia de rol');
    this.vista.mostrarActualizacion(this.grafo.actualizarVertice('U10', { nombre: 'Julián Prada Ríos' }));
    this.vista.mostrarActualizacion(this.grafo.actualizarVertice('U12', { rol: 'egresado' }));
    this.vista.mostrarActualizacion(this.grafo.actualizarVertice('U12', { rol: 'decano' })); // rol inválido
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia());

    this.vista.mostrarSubencabezado('Eliminar usuario: U05 (elimina también sus relaciones)');
    this.vista.mostrarUsuarioEliminado(this.grafo.eliminarVertice('U05'));
    this.vista.mostrarUsuarioEliminado(this.grafo.eliminarVertice('U05')); // ya no existe
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia());
  }

  // 5. Análisis final sobre el grafo resultante
  private mostrarAnalisisFinal(): void {
    this.vista.mostrarEncabezado('CASO 5 · ANÁLISIS FINAL (grafo tras las operaciones CRUD)');
    this.vista.mostrarListaAdyacencia(this.grafo.listaAdyacencia(), 'Estructura final');

    this.vista.mostrarSubencabezado('Métricas');
    this.vista.mostrarMetrica('Vértices (usuarios)', this.grafo.cantidadVertices());
    this.vista.mostrarMetrica('Aristas (relaciones)', this.grafo.cantidadAristas());
    this.vista.mostrarMetrica('Densidad  m / (n·(n−1))', this.grafo.densidad().toFixed(3));
    this.vista.mostrarMetrica('Relaciones recíprocas (parejas)', this.grafo.relacionesReciprocas());

    this.vista.mostrarSubencabezado('Conectividad');
    this.vista.mostrarComponentes(this.grafo.componentesFuertementeConexas());
    this.vista.mostrarCiclos(this.grafo.dfs().ciclos);

    this.vista.mostrarSubencabezado('Consultas sociales');
    this.consultarRanking();
  }

  private consultarRanking(): void {
    this.vista.mostrarSubencabezado('Usuarios sin seguidores (grado de entrada 0)');
    this.vista.mostrarUsuarios('Usuarios sin seguidores', this.grafo.usuariosSinSeguidores());

    this.vista.mostrarSubencabezado('Usuarios influyentes (mayor grado de entrada)');
    this.vista.mostrarGrupoPorGrado('Más seguidos', 'seguidores', this.grafo.masInfluyentes());

    this.vista.mostrarSubencabezado('Usuarios más activos (mayor grado de salida)');
    this.vista.mostrarGrupoPorGrado('Siguen a más personas', 'seguidos', this.grafo.masActivos());
  }
}
