import { CampusNetController } from './controller/CampusNetController';
import { Graph } from './model/Graph';
import { GraphView } from './view/GraphView';

// Punto de entrada: solo ensambla las capas e invoca al Controller (sin lógica de negocio).
new CampusNetController(new Graph(), new GraphView()).ejecutar();
