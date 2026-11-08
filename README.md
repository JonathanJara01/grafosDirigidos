# Taller Integrador II – Grafos Dirigidos (CampusNet)

**Universidad de Manizales · Facultad de Ciencias e Ingeniería · Programación III**
Actividad colaborativa II – Red social dirigida de usuarios académicos con arquitectura MVC.

> El enunciado pide C#/.NET; por acuerdo del curso esta versión se desarrolla en **TypeScript (Node.js)**
> conservando la misma arquitectura, reglas y casos de uso.

## Integrante y responsabilidades

| Integrante | Responsabilidades |
|---|---|
| Jonathan Jaramillo | Trabajo individual: Model (`Vertex`, `Edge`, `Graph`), View (impresión de adyacencias y resultados), Controller (casos de uso), pruebas y documentación. |

## Requisitos para ejecutar

- Node.js 18 o superior (probado con 22) y npm.
- Terminal con UTF-8 para ver los símbolos `→ ✔ ✖` (Windows Terminal / PowerShell 7; en `cmd` ejecutar antes `chcp 65001`).

```bash
npm install     # instala TypeScript y @types/node
npm start       # compila (tsc) y ejecuta dist/main.js
```

La salida completa de una ejecución está en [`evidencia/ejecucion.txt`](evidencia/ejecucion.txt).

## Arquitectura MVC

```
src/
├── main.ts                           Punto de entrada: solo ensambla e invoca al Controller
├── model/
│   ├── Vertex.ts                     Usuario: id, nombre, rol (estudiante | profesor | egresado)
│   ├── Edge.ts                       Arista dirigida origen → destino ("origen sigue a destino")
│   ├── Graph.ts                      Lista de adyacencia, CRUD, BFS, DFS, consultas y métricas
│   └── Resultados.ts                 Tipos de resultado devueltos a la View
├── view/
│   └── GraphView.ts                  Impresión en consola (sin lógica del grafo)
└── controller/
    └── CampusNetController.ts        Secuencia los casos de uso; delega todo en el Model
```

- **Model**: cero referencias a `console`. Devuelve objetos de resultado con el motivo de cada rechazo.
- **View**: solo presentación.
- **Controller**: orquesta; no contiene lógica del grafo.

## Reglas implementadas

- Grafo **dirigido** con lista de adyacencia (`Map<id, id[]>`); `A → B` significa "A sigue a B".
- **Sin duplicados**: ni vértices (mismo id) ni aristas repetidas; se rechazan y la View lo informa.
- Los ids se normalizan (sin espacios y en mayúsculas): `u01` y `U01` son el mismo usuario.
- Un usuario **no puede seguirse a sí mismo** y las relaciones exigen que ambos usuarios existan.
- Validaciones de id/nombre vacío y de rol (solo estudiante, profesor o egresado).
- Al **eliminar un usuario** se eliminan también las aristas que salen de él y las que llegan a él.

## Casos de uso que ejecuta `Main`

1. **Construcción**: 12 usuarios con los tres roles, 25 relaciones, pruebas de rechazo y lista de adyacencia.
   Cumple: 3 usuarios con grado de salida 4 (U01, U02, U06), ciclos dirigidos (p. ej. U02 → U03 → U04 → U02)
   y 2 usuarios sin seguidores (U06, U12).
2. **Recorridos**: 3 BFS (desde U01, U06 y U10) con orden de visita, distancia y cantidad de alcanzados;
   y 1 DFS completo con orden de descubrimiento, tiempos y ciclos.
3. **Consultas sociales**: sin seguidores, más influyentes (mayor grado de entrada), más activos (mayor grado de
   salida) y alcanzabilidad A → B con BFS (muestra el camino más corto).
4. **CRUD**: agregar usuario, agregar relaciones, eliminar relación, actualizar nombre y rol, eliminar usuario;
   tras cada operación se imprime la lista de adyacencia.
5. **Análisis final** sobre el grafo resultante: métricas, conectividad y consultas.

## Evidencia de ejecución (extracto)

```
── BFS desde 3 usuarios distintos ──────────────────────────────────────────
  BFS desde U01
    Orden de visita : U01 → U02 → U03 → U05 → U09 → U04 → U07 → U11
    Vértices alcanzados: 8 (incluye el origen; 7 además de U01)
  BFS desde U06
    Orden de visita : U06 → U05 → U09 → U07 → U08 → U11 → U10
    Vértices alcanzados: 7 (incluye el origen; 6 además de U06)
  BFS desde U10
    Orden de visita : U10 → U11
    Vértices alcanzados: 2 (incluye el origen; 1 además de U10)

── DFS completo ────────────────────────────────────────────────────────────
  Orden de descubrimiento: U01 → U02 → U03 → U04 → U07 → U11 → U05 → U09 → U06 → U08 → U10 → U12
  Árboles del bosque DFS: 3 (raíces: U01, U06, U12)
  Ciclos dirigidos detectados por aristas de retroceso: 2
    1. U02 → U03 → U04 → U02
    2. U01 → U02 → U01

── Consultas (grafo inicial) ───────────────────────────────────────────────
  Sin seguidores : U06, U12
  Más seguidos   : U05 y U09 (5 seguidores)
  Más activos    : U01, U02 y U06 (siguen a 4)
  ✔ U12 SÍ puede llegar a U11 (3 saltos): U12 → U01 → U09 → U11
  ✖ U11 NO puede llegar a U01

── Análisis final (tras el CRUD) ───────────────────────────────────────────
  Vértices 12 · Aristas 19 · Densidad 0.144
  Componentes fuertemente conexas: 10  ({U02, U03, U04} y 9 usuarios aislados entre sí)
  Ciclo restante: U02 → U03 → U04 → U02
```

## Análisis y justificación de resultados

- **Influencia y actividad.** Un usuario es *influyente* si tiene el mayor grado de entrada (más seguidores) y
  *activo* si tiene el mayor grado de salida (sigue a más personas). Ambas consultas devuelven **todos** los
  empatados: U05 y U09 empatan con 5 seguidores. Tras eliminar a U05, U09 queda como único influyente (4).
- **BFS y alcanzabilidad.** BFS visita por niveles, de modo que el primer camino que encuentra hacia un destino es el
  de menos aristas; por eso se usa para `puedeLlegar`. `U11` no sigue a nadie, así que no alcanza a ningún otro usuario
  y `BFS(U10)` solo llega a `U10 → U11`. La alcanzabilidad es **dirigida**: que A llegue a B no implica que B llegue a A.
- **DFS y ciclos.** El DFS usa tres colores (blanco, gris, negro). Si desde un vértice se encuentra una arista hacia
  uno **gris** (aún en la pila de recursión) es una arista de retroceso y existe un ciclo dirigido; el camino se
  reconstruye desde la pila. Se reporta un ciclo por arista de retroceso, no todos los ciclos simples. En el grafo
  inicial aparecen `U02 → U03 → U04 → U02` y el ciclo recíproco `U01 ↔ U02`; al eliminar `U02 → U01` solo queda el primero.
- **Conectividad.** Una componente fuertemente conexa es un grupo cuyos miembros se alcanzan todos entre sí. El
  grafo final tiene una de 3 usuarios ({U02, U03, U04}, el ciclo) y el resto son componentes de un solo usuario, por
  lo que la red es de difusión mayoritariamente en una dirección: la información fluye hacia usuarios como U11 y U09.
- **Densidad.** `m / (n·(n−1))` mide qué fracción de los seguimientos posibles existe; 0.144 indica una red dispersa.

## Entrega

Repositorio público en Git con el último commit dentro del plazo:

```bash
git init -b main
git add .
git commit -m "Taller 2: grafo dirigido CampusNet (MVC, TypeScript)"
git remote add origin https://github.com/TU_USUARIO/grafosDirigidos.git
git push -u origin main
```
