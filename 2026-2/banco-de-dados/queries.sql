-- Dados exclusivamente fictícios. Executar uma vez em banco de teste vazio.
BEGIN;
INSERT INTO usuario(id,nome,email,senha_hash) VALUES
 (1,'Admin fictício','admin@example.invalid','hash-ficticio-nao-utilizavel'),
 (2,'Responsável fictício','dono@example.invalid','hash-ficticio-nao-utilizavel'),
 (3,'Pessoa A','a@example.invalid','hash-ficticio-nao-utilizavel'),
 (4,'Pessoa B','b@example.invalid','hash-ficticio-nao-utilizavel'),
 (5,'Pessoa C','c@example.invalid','hash-ficticio-nao-utilizavel');
INSERT INTO pesquisa(id,titulo,administrador_id,proprietario_id) VALUES
 (1,'Avaliação institucional',1,2),(2,'Serviços do campus',1,2);
INSERT INTO categoria VALUES (1,1,'Estudantes'),(1,2,'Servidores'),(2,1,'Comunidade');
INSERT INTO questao VALUES (1,1,1,'Como avalia o atendimento?'),
 (1,1,2,'Como avalia a estrutura?'),(1,2,1,'Como avalia o suporte?'),
 (2,1,1,'Como avalia os serviços?');
INSERT INTO opcao
 SELECT pesquisa_id,categoria_id,id,v.n,v.rotulo FROM questao
 CROSS JOIN (VALUES (1,'Bom'),(2,'Regular')) AS v(n,rotulo);
INSERT INTO participacao(pesquisa_id,usuario_id,categoria_id) VALUES
 (1,3,1),(1,4,1),(1,5,2),(2,3,1);
INSERT INTO token_acesso VALUES
 (repeat('a',64),1,3),(repeat('b',64),1,4),
 (repeat('c',64),1,5),(repeat('d',64),2,3);
SELECT finalizar_questionario(repeat('a',64),'[{"questao_id":1,"opcao_id":1},{"questao_id":2,"opcao_id":2}]');
SELECT finalizar_questionario(repeat('b',64),'[{"questao_id":1,"opcao_id":2},{"questao_id":2,"opcao_id":2}]');
SELECT finalizar_questionario(repeat('c',64),'[{"questao_id":1,"opcao_id":1}]');
SELECT finalizar_questionario(repeat('d',64),'[{"questao_id":1,"opcao_id":2}]');
-- IDs explícitos da carga não devem colidir com futuros IDs automáticos.
SELECT setval(pg_get_serial_sequence('usuario','id'),(SELECT max(id) FROM usuario));
SELECT setval(pg_get_serial_sequence('pesquisa','id'),(SELECT max(id) FROM pesquisa));
COMMIT;
-- 1. Controle agregado de acesso: não associa pessoas a respostas.
SELECT p.id,p.titulo,count(a.usuario_id) AS convidados,
 count(a.usuario_id) FILTER (WHERE a.concluida) AS participantes
FROM pesquisa p LEFT JOIN participacao a ON a.pesquisa_id=p.id GROUP BY p.id,p.titulo ORDER BY p.id;
-- 2. Total de questionários respondidos, incluindo pesquisas sem respostas.
SELECT p.id,p.titulo,count(r.id) AS respostas
FROM pesquisa p LEFT JOIN resposta_anonima r ON r.pesquisa_id=p.id GROUP BY p.id,p.titulo ORDER BY p.id;
-- 3. Totais por categoria (análise interna fictícia; aplicar supressão em produção).
SELECT c.pesquisa_id,c.nome,count(r.id) AS respostas
FROM categoria c LEFT JOIN resposta_anonima r
 ON (r.pesquisa_id,r.categoria_id)=(c.pesquisa_id,c.id)
GROUP BY c.pesquisa_id,c.id,c.nome ORDER BY c.pesquisa_id,c.id;
-- 4. Distribuição estatística, inclusive opções sem votos; nenhum ID de resposta exposto.
SELECT p.titulo,c.nome,q.enunciado,o.descricao,count(i.resposta_id) AS votos
FROM pesquisa p JOIN categoria c ON c.pesquisa_id=p.id
JOIN questao q ON (q.pesquisa_id,q.categoria_id)=(c.pesquisa_id,c.id)
JOIN opcao o ON (o.pesquisa_id,o.categoria_id,o.questao_id)=(q.pesquisa_id,q.categoria_id,q.id)
LEFT JOIN (item_resposta i JOIN resposta_anonima r ON r.id=i.resposta_id)
 ON (r.pesquisa_id,r.categoria_id,i.questao_id,i.opcao_id)=
 (o.pesquisa_id,o.categoria_id,o.questao_id,o.id)
GROUP BY p.id,p.titulo,c.id,c.nome,q.id,q.enunciado,o.id,o.descricao
ORDER BY p.id,c.id,q.id,o.id;
