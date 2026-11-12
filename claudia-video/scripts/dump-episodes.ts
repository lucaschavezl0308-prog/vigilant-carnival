// Imprime los guiones de todos los episodios como JSON (lo usa generar-voces.py).
import { EPISODES } from "../src/episodes/index";

process.stdout.write(JSON.stringify(EPISODES));
