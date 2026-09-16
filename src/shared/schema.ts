/**
 * Contrato de dados do Lupa — FONTE DA VERDADE (SPEC §3.2, §3.3, §6.1).
 *
 * Tarefa T-02 / Onda 1. `types.ts` apenas deriva daqui via `z.infer`; nenhum
 * módulo declara tipo estrutural próprio (CLAUDE.md, regra 1).
 */
import { z } from 'zod';
import { estaNormalizado } from './normalize';

/** SPEC §3.3 — limites de campo. Excedente é rejeitado, nunca truncado. */
export const LIMITES = {
  sigla: 32,
  enPt: 200,
  textoLongo: 2000,
  areaProcesso: 120,
  referencia: 300,
  tags: 10,
  tagTamanho: 40,
} as const;

export const CategoriaSchema = z.enum(['automotivo', 'ti', 'corporativo', 'generico']);

export const EstrategiaSchema = z.enum(['exato', 'prefixo', 'fuzzy', 'fulltext', 'nenhum']);

export const IdiomaOrigemSchema = z.enum(['en', 'pt', 'it', 'fr']);

export const AplicacaoSchema = z.object({
  contexto: z.string().max(LIMITES.textoLongo).default(''),
  exemplo: z.string().max(LIMITES.textoLongo).default(''),
  area: z.string().max(LIMITES.areaProcesso).default(''),
  processo: z.string().max(LIMITES.areaProcesso).default(''),
  referencia: z.string().max(LIMITES.referencia).nullable().default(null),
});

export const SentidoSchema = z
  .object({
    id: z.string().min(1, 'id é obrigatório'),
    categoria: CategoriaSchema,
    en: z.string().max(LIMITES.enPt).default(''),
    pt: z.string().max(LIMITES.enPt).default(''),
    /**
     * Expansao no idioma de origem quando nao e ingles nem portugues.
     * Stellantis usa muito italiano e frances: ACE = "Alzacristallo Elettrico".
     */
    original: z.string().max(LIMITES.enPt).default(''),
    aplicacao: AplicacaoSchema,
    idiomaOrigem: IdiomaOrigemSchema.nullable().optional(),
    tags: z.array(z.string().max(LIMITES.tagTamanho)).max(LIMITES.tags).default([]),
    favorito: z.boolean().default(false),
    acessos: z.number().int().min(0).default(0),
    revisar: z.boolean().default(false),
    criadoEm: z.string().min(1),
    atualizadoEm: z.string().min(1),
  })
  // SPEC §3.4: ao menos um entre `en` e `pt`. O outro pode ficar vazio para o
  // usuário preencher depois — o app nunca completa sozinho (§3.2.1).
  .refine(
    (s) => s.en.trim().length > 0 || s.pt.trim().length > 0 || s.original.trim().length > 0,
    {
      message: 'Preencha ao menos o significado em inglês, português ou no idioma de origem',
      path: ['en'],
    },
  );

export const SiglaSchema = z.object({
  /** Chave de busca normalizada (§3.4). */
  sigla: z
    .string()
    .min(1)
    .max(LIMITES.sigla)
    .refine(estaNormalizado, { message: 'sigla deve estar normalizada (maiúsculas, sem acento/pontuação)' }),
  /** Grafia do usuário, preservada para exibição: "AD&P". */
  rotulo: z.string().min(1).max(LIMITES.enPt),
  tipo: z.enum(['sigla', 'termo']),
  sentidos: z.array(SentidoSchema).min(1, 'toda sigla precisa de ao menos um sentido'),
});

export const RepertorioSchema = z
  .object({
    schemaVersion: z.literal(1),
    /** Procedência da lista, para rastreabilidade (SPEC §3.2.1). */
    origem: z.string().max(LIMITES.referencia).optional(),
    atualizadoEm: z.string().min(1),
    siglas: z.array(SiglaSchema),
  })
  .superRefine((rep, ctx) => {
    const vistas = new Set<string>();
    rep.siglas.forEach((g, i) => {
      if (vistas.has(g.sigla)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `sigla duplicada: ${g.sigla} (sentidos diferentes vão no mesmo array)`,
          path: ['siglas', i, 'sigla'],
        });
      }
      vistas.add(g.sigla);
    });
    const ids = new Set<string>();
    rep.siglas.forEach((g, i) =>
      g.sentidos.forEach((s, j) => {
        if (ids.has(s.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `id de sentido duplicado: ${s.id}`,
            path: ['siglas', i, 'sentidos', j, 'id'],
          });
        }
        ids.add(s.id);
      }),
    );
  });

export const FiltroSchema = z.object({
  texto: z.string().optional(),
  categoria: CategoriaSchema.optional(),
  apenasFavoritos: z.boolean().optional(),
  ordenarPor: z.enum(['sigla', 'atualizadoEm', 'acessos']).optional(),
  direcao: z.enum(['asc', 'desc']).optional(),
});

export const ResultadoBuscaSchema = z.object({
  termo: z.string(),
  normalizado: z.string(),
  estrategia: EstrategiaSchema,
  resultados: z.array(SiglaSchema).max(10),
  sugestaoCadastro: z.boolean(),
});

export const RelatorioImportSchema = z.object({
  inseridos: z.number().int().min(0),
  atualizados: z.number().int().min(0),
  ignorados: z.number().int().min(0),
  erros: z.array(z.object({ linha: z.number().int(), campo: z.string(), mensagem: z.string() })),
  backupCriado: z.string(),
});

export const ConfigSchema = z.object({
  atalhoGlobal: z.string().min(1).default('Ctrl+Alt+L'),
  iniciarComWindows: z.boolean().default(false),
  tema: z.enum(['claro', 'escuro', 'sistema']).default('sistema'),
  opacidadeOciosa: z.number().min(0.3).max(1).default(0.55),
  abaPadrao: z.enum(['en', 'pt', 'aplicacao']).default('en'),
  categoriaPreferida: CategoriaSchema.nullable().default(null),
  pastaRepertorio: z.string().default(''),
  fixarPainel: z.boolean().default(false),
  posicaoLupa: z.object({ x: z.number(), y: z.number() }).default({ x: -1, y: -1 }),
  tamanhoHistorico: z.number().int().min(1).max(100).default(10),
  /** SPEC §3.2.1 — a carga inicial é aplicada UMA única vez. */
  cargaInicialAplicadaEm: z.string().nullable().default(null),
  cargaInicialHash: z.string().nullable().default(null),
});
