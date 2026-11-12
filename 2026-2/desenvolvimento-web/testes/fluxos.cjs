const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

const base = path.resolve(__dirname, '..');
const root = path.join(base, 'src');
const evidence = path.join(__dirname, 'evidencias');
fs.mkdirSync(evidence, {recursive: true});
const results = [];
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg'};
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless: true, ...(process.env.WEB_BROWSER_EXECUTABLE ? {executablePath: process.env.WEB_BROWSER_EXECUTABLE} : {})});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('request', request => requests.push({url: request.url(), method: request.method()}));
    const pages = ['index.html','login.html','main.html',...fs.readdirSync(path.join(root,'paginas')).filter(n=>n.endsWith('.html')).map(n=>'paginas/'+n)];
    for (const width of [360,1280]) {
      await page.setViewportSize({width,height:900});
      for (const name of pages) {
        await page.goto(`${url}/${name}`);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `${name}: overflow em ${width}`);
        assert.equal(await page.locator('main').count(),1);
        assert.equal(await page.locator('img:not([alt])').count(),0);
        assert(await page.evaluate(()=>[...document.querySelectorAll('input,select,textarea')].every(el=>el.labels.length>0)));
        if (['index.html','login.html','paginas/responder.html','paginas/relatorios.html'].includes(name)) {
          await page.screenshot({path:path.join(evidence,`${width}-${path.basename(name,'.html')}.png`),fullPage:true});
        }
      }
      results.push(`${pages.length} páginas em ${width}px: sem overflow; landmarks, rótulos e imagens conferidos`);
    }
    await page.goto(`${url}/login.html`);
    await page.locator('form').first().locator('button').click();
    assert.match(await page.locator('.form-feedback').first().innerText(), /Revise/);
    await page.fill('#email','aluno@example.com');
    await page.fill('#senha','Teste!2026');
    await page.selectOption('#perfil','aluno');
    await page.locator('form').first().locator('button').click();
    await page.waitForURL('**/main.html');
    assert.equal(new URL(page.url()).search,'');
    results.push('Login demonstrativo: vazio rejeitado; formato válido navega sem expor credenciais na URL');

    await page.goto(`${url}/paginas/pesquisa.html`);
    await page.fill('#titulo','Pesquisa teste'); await page.fill('#descricao','Descrição fictícia');
    await page.fill('#inicio','2026-10-21'); await page.fill('#fim','2026-10-20');
    await page.selectOption('#status',{label:'Ativa'}); await page.locator('button[type=submit]').click();
    assert(await page.locator('#fim').evaluate(el=>!el.validity.valid));
    await page.fill('#fim','2026-10-22'); await page.locator('button[type=submit]').click();
    assert.match(await page.locator('.form-feedback').innerText(),/Demonstração concluída/);
    await page.locator('button[type=submit]').click();
    assert(await page.locator('#titulo').evaluate(el=>!el.validity.valid));
    results.push('Pesquisa: intervalo inválido e título duplicado rejeitados; dados válidos aceitos');

    await page.goto(`${url}/paginas/questionario.html`);
    await page.selectOption('#pesquisa',{index:1}); await page.selectOption('#categoria',{index:1});
    await page.locator('button[type=submit]').click();
    assert.match(await page.locator('.form-feedback').innerText(),/pelo menos uma/);
    await page.check('#p1'); await page.locator('button[type=submit]').click();
    assert.match(await page.locator('.form-feedback').innerText(),/Demonstração concluída/);
    results.push('Configuração do questionário exige ao menos uma pergunta');

    await page.goto(`${url}/paginas/perguntas.html`);
    await page.fill('#pergunta','Escolha uma opção'); await page.selectOption('#tipo',{label:'Múltipla escolha'});
    await page.fill('#alternativas','A\nA'); await page.locator('button[type=submit]').click();
    assert(await page.locator('#alternativas').evaluate(el=>!el.validity.valid));
    await page.fill('#alternativas','A\nB'); await page.locator('button[type=submit]').click();
    assert.match(await page.locator('.form-feedback').innerText(),/Demonstração concluída/);
    results.push('Pergunta de escolha exige duas alternativas distintas');

    await page.goto(`${url}/paginas/responder.html`);
    await page.click('#next'); assert.equal(await page.locator('#step-progress').innerText(),'Etapa 1 de 4');
    await page.fill('#senha','ERRADO'); await page.click('#next');
    assert.equal(await page.locator('#step-progress').innerText(),'Etapa 1 de 4');
    await page.fill('#senha','DEMO-2026'); await page.click('#next');
    await page.click('#next'); assert.equal(await page.locator('#step-progress').innerText(),'Etapa 2 de 4');
    await page.selectOption('#q1',{label:'Boa'}); await page.click('#next');
    await page.click('#previous'); assert.equal(await page.inputValue('#q1'),'Boa');
    await page.click('#next'); await page.selectOption('#q2',{label:'Sim'}); await page.click('#next');
    await page.fill('#comentario','Comentário de teste'); await page.click('#finish');
    assert.match(await page.locator('.form-feedback').innerText(),/Demonstração concluída!/);
    assert(await page.locator('#finish').isDisabled());
    assert.equal(await page.inputValue('#senha'),'');
    results.push('Respondente: código inválido, obrigatoriedade, avanço/retorno com preservação e conclusão única testados');

    await page.goto(`${url}/paginas/relatorios.html`);
    await page.selectOption('#categoria',{label:'Professor'}); await page.locator('button[type=submit]').click();
    assert.equal(await page.locator('tbody td').first().innerText(),'17');
    results.push('Relatório fictício muda conforme filtro de categoria');
    await page.goto(`${url}/paginas/senhas.html`);
    await page.selectOption('#categoria',{index:1}); await page.fill('#quantidade','2');
    await page.locator('button[type=submit]').click();
    assert.equal((await page.locator('.form-feedback').innerText()).match(/DEMO-/g).length,2);
    results.push('Geração demonstra quantidade de códigos solicitada');
    assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);
    assert(!requests.some(req=>req.method!=='GET'));
    assert(!requests.some(req=>req.url.includes('?')));
    assert.deepEqual(errors,[]);
    results.push('Sem erros JavaScript/HTTP, envios POST, parâmetros em URL ou dados em localStorage/sessionStorage');
    await context.close();

    const nojs = await browser.newContext({javaScriptEnabled:false});
    const staticPage = await nojs.newPage();
    await staticPage.goto(`${url}/login.html`);
    assert(await staticPage.locator('form button').first().isDisabled());
    results.push('Sem JavaScript: botão de login permanece desativado; credenciais não são enviadas');
    await nojs.close();
    fs.writeFileSync(path.join(evidence,'resultado.json'),JSON.stringify({date:new Date().toISOString(),browser:browser.version(),results},null,2)+'\n');
    console.log(results.join('\n'));
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
