/** Arista dirigida: `origen` sigue a `destino` (origen → destino). */
export class Edge {
  constructor(
    public readonly origen: string,
    public readonly destino: string,
  ) {}
}
