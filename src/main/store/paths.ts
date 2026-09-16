import { app } from 'electron';
import { join } from 'node:path';

/** SPEC §3.1 — dados fora da pasta do app, para reinstalar não apagar nada. */
export const pastaDados = (): string => app.getPath('userData');
export const arquivoRepertorio = (): string => join(pastaDados(), 'repertorio.json');
export const arquivoConfig = (): string => join(pastaDados(), 'config.json');
export const pastaBackups = (): string => join(pastaDados(), 'backups');
