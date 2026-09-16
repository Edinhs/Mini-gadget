# BRIEFING — Lupa (Mini-Gadget de Siglas)

> Documento de negócio. Responde *o quê*, *para quem* e *por quê*.
> Versão 1.0 — 2026-09-16 · Owner: Edinho Siqueira

---

## 1. Resumo executivo

**Lupa** é um mini-gadget de desktop para Windows que fica permanentemente visível
na tela do usuário como um ícone flutuante de lupa. Ao clicar, abre uma caixa de
busca onde o usuário digita uma sigla; o gadget responde instantaneamente com:

1. **Significado em Inglês** (expansão original da sigla);
2. **Significado em Português** (tradução / equivalente usado no dia a dia);
3. **Aplicação** — em duas abas: *Contexto de uso* (como e quando se usa, com
   frase de exemplo) e *Onde aparece* (área, processo e referência documental).

Todo o conhecimento vem de um **repertório local**, alimentado pelo próprio
usuário, versionado e 100% offline.

## 2. Problema

Ambientes de engenharia e corporativos são saturados de siglas. O custo real:

| Dor | Efeito |
|---|---|
| Sigla desconhecida em reunião/e-mail | Interrupção de fluxo, perda de contexto |
| Busca em Google/planilha/SharePoint | 30–120s por consulta, troca de janela |
| Sigla interna sem definição pública | Google não resolve; depende de perguntar a alguém |
| Conhecimento tácito na cabeça de poucos | Onboarding lento, retrabalho |

A consulta precisa custar **menos de 5 segundos e zero troca de contexto**.

## 3. Objetivo

Reduzir o tempo de resolução de uma sigla de ~60s para **< 5s**, sem tirar o
usuário da tela em que está trabalhando, e transformar conhecimento tácito em um
repertório pessoal acumulável e exportável.

## 4. Público-alvo

- **Primário:** o próprio usuário — engenharia automotiva (Stellantis/PHES),
  com exposição simultânea a siglas de TI e de gestão corporativa.
- **Secundário:** colegas de time que recebam o instalador e o repertório
  compartilhado (export/import de arquivo).

## 5. Princípios de produto

1. **Sempre à mão, nunca no caminho** — always-on-top, arrastável, ~48px,
   opacidade reduzida quando ocioso.
2. **Offline-first** — nenhuma consulta depende de rede. Sem API, sem chave,
   sem custo por consulta, sem vazamento de sigla interna para fora.
3. **Resposta em um clique** — atalho global abre direto no campo de busca.
4. **O repertório é do usuário** — arquivo legível (JSON), importável/exportável
   em Excel/CSV, versionável.
5. **Confiança sobre cobertura** — melhor dizer "não encontrei, quer cadastrar?"
   do que inventar um significado.

## 6. Escopo

### 6.1 Dentro do escopo (v1.0)
- Gadget flutuante always-on-top no Windows, arrastável, posição persistida.
- Atalho global (padrão `Ctrl+Alt+L`) para abrir/fechar o painel.
- Busca de sigla com resultado em EN / PT / Aplicação (2 abas).
- Busca tolerante a erro de digitação, acento, ponto e caixa (`p.h.e.s` = `PHES`).
- Desambiguação: mesma sigla com múltiplos significados por categoria.
- CRUD completo do repertório dentro do app (cadastrar, editar, excluir).
- Importar/exportar repertório em JSON, CSV e XLSX.
- Três caminhos de entrada de siglas: **carga inicial** a partir da lista
  enviada pelo usuário, **import de planilha** Excel/CSV e **cadastro manual**
  pelo botão "+ Nova sigla" na tela do app.
- Histórico das últimas consultas e favoritos.
- Iniciar com o Windows (opcional) e minimizar para a bandeja.
- Instalador Windows (.exe) + versão portátil.

### 6.2 Fora do escopo (v1.0 — candidatos a v2)
- Consulta a IA/API online para siglas não cadastradas.
- Sincronização em nuvem / repertório compartilhado multi-usuário.
- Versões macOS, Linux, Android.
- OCR / captura de sigla direto da tela.
- Integração com SharePoint/Confluence.

## 7. Métricas de sucesso

| # | Métrica | Meta v1.0 |
|---|---|---|
| M1 | Tempo do atalho até o resultado na tela | < 1,5 s |
| M2 | Tempo de inicialização a frio do gadget | < 3 s |
| M3 | Taxa de acerto na primeira busca (repertório populado) | ≥ 90% |
| M4 | Consumo de RAM em repouso | < 180 MB |
| M5 | Siglas da lista do usuário importadas sem erro | 100% |
| M6 | Passos para cadastrar uma sigla nova | ≤ 4 |

## 8. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Repertório vazio no primeiro boot | Médio | Estado vazio com CTA claro ("cadastre sua primeira sigla" / "importar planilha"); carga inicial feita com a lista do próprio usuário antes da entrega |
| Significado incorreto por sigla inventada | Alto | **Nenhuma sigla entra no repertório sem vir do usuário.** Nada de conteúdo gerado ou pesquisado externamente |
| Electron pesado / lento para um widget | Médio | Janela única leve, lazy-load do painel, meta M2/M4 medida |
| Corrupção do arquivo de dados | Alto | Escrita atômica (tmp + rename) + backup rotativo |
| Ambiguidade de sigla entre domínios | Médio | Múltiplos sentidos por sigla, ordenados por categoria e uso |
| Política de TI bloqueia app não assinado | Médio | Entregar também versão portátil, sem instalação |
| Perda do repertório ao reinstalar | Alto | Dados em `%APPDATA%`, fora da pasta do app + export XLSX |

## 9. Premissas

- Windows 10/11 64-bit, sem exigência de privilégio de administrador.
- **O usuário é a única fonte de verdade do repertório.** O app não gera, não
  sugere e não busca significados em lugar nenhum.
- Usuário mantém o repertório manualmente; não há fonte de verdade externa.
- Entrega priorizando **funcional e rápido** sobre completude de features.

## 10. Entregáveis do projeto

| Entregável | Formato |
|---|---|
| Briefing | `docs/BRIEFING.md` |
| Especificação técnica e funcional | `docs/SPEC.md` |
| Verificação Funcional (testes/aceite) | `docs/VF.md` |
| Sprint Planning & Release | `docs/SPR.md` |
| Malha de agentes e skills | `docs/AGENTS.md` |
| Repertório inicial | Gerado a partir das siglas enviadas pelo usuário |
| Aplicação | Instalador `.exe` + portátil |
