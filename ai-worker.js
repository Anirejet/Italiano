/* Trabajador en segundo plano para la IA local (así la app no se queda congelada mientras la IA piensa). */
import { WebWorkerMLCEngineHandler } from "./vendor/web-llm.js";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = msg => handler.onmessage(msg);
