export type Rol = 'estudiante' | 'profesor' | 'egresado';

export const ROLES: readonly Rol[] = ['estudiante', 'profesor', 'egresado'];

/** Usuario de CampusNet (vértice del grafo). */
export class Vertex {
  constructor(
    public readonly id: string,
    public nombre: string,
    public rol: Rol,
  ) {}
}
