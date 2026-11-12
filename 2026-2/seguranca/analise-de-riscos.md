# Análise de riscos e ameaças web

- **Projeto:** Sistema Web para Gestão de Pesquisas por Questionários
- **Escopo:** protótipo acadêmico documentado em `2026-2`
- **Issue:** [#10 — Análise de Riscos Básica e Ameaças Web](https://github.com/Fatec-Extensao/pi-ads-2026-2-igor/issues/10)
- **Revisão:** 11 de novembro de 2026

## 1. Objetivo e limites

Este relatório identifica ameaças relevantes ao sistema, estima probabilidade e impacto e propõe medidas de tratamento. A análise considera os requisitos, o protótipo web e o modelo PostgreSQL presentes no repositório.

O material disponível descreve um protótipo acadêmico. O projeto registra que ainda não há backend integrado, autenticação real, autorização, emissão e entrega de tokens ou conexão da aplicação com o banco. Portanto, os riscos abaixo são uma análise de desenho e implementação prevista, não um atestado de segurança, uma avaliação de vulnerabilidade executada contra um sistema publicado ou uma certificação de conformidade. A probabilidade é estimativa qualitativa para a arquitetura pretendida; não foi calculada a partir de telemetria de produção.

O protótipo não deve receber dados pessoais reais nem ser usado para decisões ou pesquisas reais até que os controles prioritários sejam implementados, verificados e aprovados pelos responsáveis pelo tratamento.

## 2. Sistema e ativos considerados

O fluxo previsto permite que um administrador configure pesquisas, participantes respondam com credenciais individuais e responsáveis consultem resultados agregados. O modelo de dados inclui usuários, pesquisas, perguntas e opções, participações, hashes de tokens de acesso e respostas separadas da identidade do participante.

Ativos e propriedades a proteger:

| Ativo | Propriedades de segurança relevantes |
| --- | --- |
| Contas, e-mails e hashes de senha | Confidencialidade e integridade; acesso apenas às funções autorizadas |
| Pesquisas, perguntas e opções | Integridade; confidencialidade antes da publicação, quando aplicável |
| Tokens e participações | Confidencialidade e integridade; impedir uso, repetição ou associação indevida |
| Respostas e resultados agregados | Confidencialidade, integridade e proteção contra identificação indireta |
| Banco, aplicação e cópias de segurança | Confidencialidade, integridade, disponibilidade e recuperabilidade |
| Registros técnicos e segredos de configuração | Confidencialidade; disponibilidade para investigação sem guardar payloads desnecessários |

## 3. Premissas e controles observados

### Controles existentes nos artefatos acadêmicos

- O schema PostgreSQL define chaves, restrições de integridade e gatilhos para validar contexto de respostas.
- `finalizar_questionario(hash, itens)` foi projetada para bloquear token e participação, validar o conjunto de respostas, consumir o token e concluir a participação na transação do chamador.
- O modelo separa estruturalmente respostas e identidade: a resposta não guarda usuário, participação, token ou IP.
- Há testes SQL de integridade e um teste de concorrência documentado.
- O próprio modelo lógico declara que o anonimato é estrutural, não absoluto, e identifica riscos de grupos pequenos, logs, metadados e operadores privilegiados.

Esses controles limitam alguns erros de consistência no banco. Não impedem, por si, um cliente malicioso, uma conta comprometida, SQL arbitrário por credencial privilegiada, coleta de dados no servidor, configuração insegura ou correlação por observabilidade.

### Lacunas que afetam esta análise

- O backend, a autenticação e a autorização ainda não foram implementados.
- Não há política de papéis e permissões do banco pronta para produção; o schema informa que a função é `SECURITY INVOKER` e que a política de `GRANT`/roles está pendente.
- A geração, distribuição, validade e revogação de credenciais/tokens ainda precisam de definição e implementação.
- Não há evidência de teste de invasão, análise dinâmica de segurança, revisão de dependências, operação de backups ou resposta a incidentes de produção.
- A hospedagem estática do protótipo não implementa uma API segura para persistência. Não se deve inserir segredo de banco ou credencial privilegiada no navegador.

## 4. Método e escala

A classificação é qualitativa e serve para priorizar o trabalho. Não representa frequência medida. Probabilidade e impacto usam escala de 1 a 5.

| Nota | Probabilidade | Impacto |
| --- | --- | --- |
| 1 | Rara nas condições consideradas | Limitado e facilmente reversível |
| 2 | Improvável, mas plausível | Restrito a poucos registros ou breve interrupção |
| 3 | Possível | Exposição ou alteração relevante, ou indisponibilidade perceptível |
| 4 | Provável diante das lacunas atuais ou de exposição significativa | Exposição ampla, fraude ou interrupção grave |
| 5 | Muito provável ou já facilitada pelo desenho observado | Dano extenso, persistente ou difícil de reverter |

**Nível = probabilidade × impacto.** Faixas: 1–4 baixo; 5–9 moderado; 10–16 alto; 17–25 crítico. A classificação residual é uma expectativa após implementar e validar as medidas; não descreve o estado atual.

## 5. Registro e matriz de riscos

| ID | Ameaça e cenário | Prob. | Impacto | Nível inerente | Tratamento prioritário | Residual esperado* |
| --- | --- | ---: | ---: | --- | --- | --- |
| R1 | **Injeção SQL e abuso do banco:** dados de entrada são concatenados a comandos SQL ou a conta da aplicação tem privilégios excessivos. Um atacante altera, lê ou destrói dados, ou contorna regras de participação. | 3 | 5 | 15 — Alto | Usar consultas parametrizadas; nunca montar SQL com entrada do usuário; validar formato e tamanho no servidor; conceder à aplicação somente os privilégios necessários; impedir acesso direto do navegador ao banco; manter `public` sem `CREATE` para papéis não confiáveis; revisar funções e `search_path`; testar entradas adversariais e permissões. | 5 — Moderado |
| R2 | **Acesso não autorizado e falha de isolamento:** autorização ausente ou incompleta permite que participante, administrador ou proprietário consulte ou altere pesquisa, participação ou resultados de outra pessoa. Identificadores enviados pelo cliente são aceitos sem verificar titularidade e papel. | 4 | 5 | 20 — Crítico | Implementar autenticação no servidor; verificar autorização em cada operação e objeto; negar por padrão; validar papel e vínculo à pesquisa em todas as consultas; separar funções administrativas e de participante; testar acesso horizontal/vertical com contas distintas; manter trilha de alterações administrativas sem conteúdo de respostas. | 10 — Alto |
| R3 | **Vazamento ou reidentificação de respostas:** acesso indevido, publicação de grupos pequenos, cruzamento de resultados ou logs/metadados associam uma resposta à pessoa. A separação no schema não elimina inferência por categoria, horário, grupo ou operador privilegiado. | 3 | 5 | 15 — Alto | Não publicar microdados; definir limiar mínimo de divulgação e supressão complementar antes de uso real; limitar cruzamentos; revisar resultados antes da exportação; remover payload, token, senha e resposta dos logs; restringir acesso a logs/backups; avaliar risco de reidentificação por contexto e tamanho do grupo. O limiar deve ser aprovado pelo responsável, não presumido neste relatório. | 10 — Alto |
| R4 | **Fraude, repetição ou roubo de token:** token previsível, exposto em URL/log, reutilizável, não expirado ou distribuído à pessoa errada permite responder em nome de outro participante ou tentar múltiplas submissões. | 3 | 4 | 12 — Alto | Gerar token criptograficamente aleatório com entropia adequada; armazenar somente hash; entregar por canal definido e protegido; aplicar validade, revogação e limitação de tentativas; não registrar token; proteger sessão contra CSRF quando aplicável; consumir token e concluir participação atomicamente; testar replay e concorrência. Definir expiração e canal antes da implementação. | 6 — Moderado |
| R5 | **Comprometimento de conta ou senha:** senha fraca, reutilizada, armazenada de forma inadequada ou tentativa automatizada permite acesso administrativo, alteração de pesquisas ou consulta de resultados. | 3 | 5 | 15 — Alto | Armazenar senhas com algoritmo adaptativo moderno e parâmetros atualizados (por exemplo, Argon2id); jamais texto simples ou hash rápido isolado; limitar tentativas e aplicar atraso progressivo; oferecer recuperação segura; exigir MFA para administração quando viável; proteger sessão, cookies e segredos; registrar e alertar tentativas anormais sem gravar credenciais. | 8 — Moderado |
| R6 | **Indisponibilidade, perda ou corrupção:** falha de infraestrutura, erro operacional, ransomware ou abuso de requisições interrompe pesquisas ou torna resultados irrecuperáveis. | 3 | 4 | 12 — Alto | Definir responsáveis e objetivos de recuperação; limitar requisições e tamanho de payload; manter backups criptografados e separados; controlar acesso aos backups; testar restauração periodicamente; monitorar disponibilidade e erros; documentar resposta e comunicação. Nenhuma rotina de backup/recuperação de produção foi evidenciada nos artefatos. | 6 — Moderado |
| R7 | **Configuração ou segredo exposto:** credenciais, tokens ou detalhes do banco aparecem em código público, arquivos de configuração, histórico Git, logs ou mensagem de erro. | 3 | 5 | 15 — Alto | Guardar segredos em mecanismo de configuração seguro fora do repositório e do navegador; rotacionar segredo exposto; restringir origem de rede e permissões; desabilitar mensagens detalhadas em produção; verificar histórico e artefatos de build; separar ambientes e credenciais de desenvolvimento e produção. | 5 — Moderado |
| R8 | **Componente vulnerável ou cadeia de fornecimento comprometida:** dependência desatualizada, pacote adulterado ou processo de publicação comprometido executa código malicioso ou expõe dados. | 3 | 4 | 12 — Alto | Inventariar e fixar versões; atualizar dependências; revisar avisos de segurança e origem/licença dos pacotes; executar análise automatizada de dependências no fluxo de integração; restringir permissões de publicação e proteger segredos de CI; revisar artefato publicado. | 6 — Moderado |
| R9 | **Falhas de log e resposta a incidente:** evento suspeito não é detectado ou logs contêm dados pessoais e permitem correlação; equipe não consegue conter, investigar ou avaliar o impacto. | 3 | 4 | 12 — Alto | Criar procedimento de resposta com responsáveis, contenção, preservação de evidências, avaliação de titulares/dados e comunicação; registrar eventos de segurança sem conteúdo sensível; restringir e monitorar acesso aos registros; sincronizar relógios; manter registro de incidentes e decisões; ensaiar o procedimento. | 6 — Moderado |

\* Residual esperado após medidas executadas e verificadas. Nenhuma redução de risco deve ser considerada efetiva antes de evidência de implementação e teste.

### Matriz 5 × 5 (risco inerente)

Cada célula apresenta **nível (probabilidade × impacto)**. Os riscos da tabela acima estão indicados por seus IDs.

| Probabilidade ↓ / Impacto → | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| **5 — Muito provável** | 5 Moderado | 10 Alto | 15 Alto | 20 Crítico | 25 Crítico |
| **4 — Provável** | 4 Baixo | 8 Moderado | 12 Alto | 16 Alto | 20 Crítico (**R2**) |
| **3 — Possível** | 3 Baixo | 6 Moderado | 9 Moderado | 12 Alto (**R4, R6, R8, R9**) | 15 Alto (**R1, R3, R5, R7**) |
| **2 — Improvável** | 2 Baixo | 4 Baixo | 6 Moderado | 8 Moderado | 10 Alto |
| **1 — Rara** | 1 Baixo | 2 Baixo | 3 Baixo | 4 Baixo | 5 Moderado |

A matriz prioriza R2 por combinar lacunas presentes no escopo acadêmico com impacto potencial amplo. R1, R3, R5 e R7 também requerem tratamento antes de qualquer operação com dados reais.

## 6. Ameaças e mitigação por prioridade

### Prioridade 0 — antes de tratar dados reais

1. **Implementar backend confiável:** navegador comunica-se somente com API por TLS; nunca recebe credencial de banco. A API valida entrada e aplica autenticação e autorização no servidor.
2. **Definir papéis e limites de acesso:** negar por padrão; verificar em cada requisição o papel, a pesquisa e o vínculo do usuário; separar permissões administrativas, de participação e de consulta de agregados.
3. **Proteger banco e transação de resposta:** consultas parametrizadas; credenciais distintas por ambiente; papel de serviço com privilégio mínimo; sem permissões de DDL para o serviço comum; limitar escrita anônima ao fluxo validado de finalização; testar que não seja possível inserir resposta sem consumir participação/token pelo papel da aplicação.
4. **Fechar o ciclo de tokens:** documentar geração criptográfica, armazenamento apenas do hash, entrega, expiração, revogação, limitação de tentativas e comportamento após uso. Testar cópia, replay, concorrência e vazamento em URL/log.
5. **Definir proteção contra inferência:** decidir limiar mínimo, supressão complementar, revisão de exportações e acesso a resultados, considerando tamanho e sensibilidade do grupo. O anonimato não deve ser prometido como absoluto.
6. **Preparar operação segura:** HTTPS/TLS; gestão de segredos; erros genéricos ao usuário; logs minimizados e protegidos; backups criptografados; teste de restauração; monitoramento e procedimento de incidente.

### Prioridade 1 — antes de abertura ampla

- Testar autorização por objeto e por função, injeção, validação de entrada, CSRF quando aplicável, segurança de sessão, limitação de taxa e abuso automatizado.
- Revisar dependências, configuração do ambiente, cabeçalhos de segurança e permissões de publicação.
- Executar revisão de código e testes de segurança com dados fictícios; registrar evidências e responsáveis por corrigir cada achado.
- Estabelecer processo de atualização, correção urgente, gestão de vulnerabilidades e revisão periódica da matriz.
- Definir objetivo de recuperação, periodicidade e retenção de backup, com restauração comprovada.

## 7. Resposta a incidentes e obrigações relevantes

A Lei nº 13.709/2018 (LGPD) prevê medidas técnicas e administrativas de segurança para proteger dados pessoais contra acesso não autorizado e eventos acidentais ou ilícitos (arts. 46 e 47). O art. 48 trata da comunicação, pelo controlador à ANPD e aos titulares, de incidente que possa acarretar risco ou dano relevante. A Resolução CD/ANPD nº 15/2024 regulamenta critérios, conteúdo e prazos: em regra, três dias úteis para a comunicação pelo controlador, contados do conhecimento de que o incidente afetou dados pessoais; a resolução prevê tratamento de prazo diferenciado para agentes de pequeno porte elegíveis conforme regulamentação aplicável. A classificação do agente e eventual prazo específico devem ser confirmados pelo controlador no caso concreto. A comunicação complementar pode ser feita nos termos e prazo previstos no regulamento quando justificada a falta de informação completa. O registro de incidentes deve ser mantido por pelo menos cinco anos, conforme art. 10 da Resolução.

Fluxo recomendado para a futura operação:

1. Receber o alerta, registrar data/hora e designar responsável pelo incidente.
2. Conter o acesso ou serviço afetado sem destruir evidências; revogar credenciais/tokens e preservar registros relevantes.
3. Confirmar se houve incidente e se envolve dados pessoais; identificar natureza/categorias dos dados, titulares e período potencialmente afetado.
4. Avaliar probabilidade e gravidade de dano aos titulares, escala, sensibilidade, possibilidade de identificação e medidas de mitigação.
5. O controlador decide e executa as comunicações legalmente exigidas à ANPD e aos titulares, observando prazo e forma aplicáveis; o operador informa o controlador sem demora injustificada e coopera.
6. Corrigir a causa, recuperar o serviço, documentar decisão e evidências, e revisar esta matriz para prevenir recorrência.

Este fluxo é recomendação de preparação, não procedimento operacional já implementado pelo projeto.

## 8. Regras e referências utilizadas

- **LGPD — Lei nº 13.709/2018:** especialmente princípios de segurança e prevenção (art. 6º, VII e VIII), segurança no tratamento (arts. 46–49) e responsabilidade e prestação de contas (art. 6º, X). A aplicação depende do contexto e dos papéis reais de controlador e operador.
- **Resolução CD/ANPD nº 15/2024:** Regulamento de Comunicação de Incidente de Segurança; critérios de risco/dano relevante, comunicação, prazos e registro de incidentes.
- **Resolução CD/ANPD nº 2/2022, alterada pela Resolução nº 15/2024:** regras específicas para agentes de tratamento de pequeno porte, incluindo medidas técnicas e administrativas essenciais; a elegibilidade não é presumida para este projeto.
- **Guia Orientativo da ANPD sobre Segurança da Informação para Agentes de Tratamento de Pequeno Porte:** referência prática para controle de acesso, segurança de dados armazenados e comunicações, vulnerabilidades, dispositivos e nuvem. Guia orientativo não substitui a lei nem avaliação do caso concreto.
- **OWASP Top 10:2025:** referência de conscientização sobre riscos web, incluindo controle de acesso quebrado, configuração insegura, falhas na cadeia de fornecimento, falhas criptográficas, injeção, desenho inseguro, falhas de autenticação, integridade de software/dados e logging/alerting.
- **OWASP ASVS 5.0.0:** base verificável para especificar e testar controles de aplicações web; recomenda-se selecionar requisitos aplicáveis ao backend quando ele for desenvolvido.

OWASP é referência técnica, não lei brasileira. A matriz e as medidas deste documento são recomendações de engenharia e não declaração de conformidade jurídica.

## 9. Conclusão e critérios para revisão

A arquitetura acadêmica contém boas decisões de integridade no banco e separação estrutural das respostas, mas a aplicação ainda não possui a camada de servidor que autentica, autoriza e controla o acesso às operações. Os riscos de acesso indevido, SQL injection, exposição ou inferência de respostas e comprometimento de contas permanecem relevantes até que backend, permissões, gestão de tokens, observabilidade e operação segura sejam implementados e verificados.

A issue #10 está documentalmente coberta por este relatório: ameaças listadas; injeção SQL, vazamento de respostas e fraude analisados; riscos classificados por probabilidade e impacto; matriz 5 × 5 incluída; mitigação e referências legais/técnicas registradas. A implementação e verificação dos controles permanecem etapas futuras antes de qualquer uso real.

## Referências

1. Brasil. [Lei nº 13.709, de 14 de agosto de 2018 — Lei Geral de Proteção de Dados Pessoais](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm).
2. ANPD. [Resolução CD/ANPD nº 15, de 24 de abril de 2024 — Regulamento de Comunicação de Incidente de Segurança](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/).
3. ANPD. [Resolução CD/ANPD nº 2, de 27 de janeiro de 2022 — agentes de tratamento de pequeno porte](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).
4. ANPD. [Comunicação de Incidente de Segurança — critérios, avaliação e procedimento](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis).
5. ANPD. [Guia Orientativo sobre Segurança da Informação para Agentes de Tratamento de Pequeno Porte](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/processo-guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte.pdf).
6. OWASP. [Top 10:2025 — Introduction](https://owasp.org/Top10/2025/0x00_2025-Introduction/), [A01 Broken Access Control](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/) e [A05 Injection](https://owasp.org/Top10/2025/A05_2025-Injection/).
7. OWASP. [Application Security Verification Standard 5.0.0](https://asvs.owasp.org/).
8. OWASP. [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
