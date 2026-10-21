'use strict';

// Protótipo estático: nenhum fetch, cookie, armazenamento ou envio de formulário.
const page = location.pathname.split('/').pop();
const controls = form => [...form.querySelectorAll('input, select, textarea')];

function feedback(form, text, error = false) {
  const node = form.querySelector('.form-feedback');
  node.textContent = text;
  node.dataset.error = String(error);
  node.focus();
}

function validate(form, fields = controls(form)) {
  for (const field of fields) {
    field.removeAttribute('aria-invalid');
    if (!field.checkValidity()) {
      feedback(form, 'Revise os campos obrigatórios e o formato dos dados.', true);
      field.setAttribute('aria-invalid', 'true');
      field.reportValidity();
      field.focus();
      return false;
    }
  }
  return true;
}

for (const form of document.forms) {
  form.noValidate = true;
  for (const button of form.querySelectorAll('button')) button.disabled = false;
  form.addEventListener('input', event => {
    if (event.target.setCustomValidity) event.target.setCustomValidity('');
    event.target.removeAttribute('aria-invalid');
  });
  if (form.hasAttribute('data-questionnaire')) {
    setupQuestionnaire(form);
    continue;
  }
  const names = new Set(['aluno', 'professor', 'pesquisa de satisfação 2026']);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate(form)) return;
    if (page === 'login.html') {
      for (const field of form.querySelectorAll('input[type="password"]')) field.value = '';
      location.assign('main.html');
      return;
    }
    if (page === 'pesquisa.html') {
      const start = form.querySelector('#inicio');
      const end = form.querySelector('#fim');
      if (end.value < start.value) {
        end.setCustomValidity('A data final deve ser igual ou posterior à data de início.');
        validate(form); return;
      }
    }
    if (page === 'questionario.html' && !form.querySelector('input[type="checkbox"]:checked')) {
      feedback(form, 'Selecione pelo menos uma pergunta para o questionário.', true);
      form.querySelector('input[type="checkbox"]').focus(); return;
    }
    if (page === 'perguntas.html' && form.querySelector('#tipo').value === 'Múltipla escolha') {
      const field = form.querySelector('#alternativas');
      const options = field.value.split('\n').map(s => s.trim()).filter(Boolean);
      if (options.length < 2 || new Set(options.map(s => s.toLocaleLowerCase('pt-BR'))).size !== options.length) {
        field.setCustomValidity('Informe pelo menos duas alternativas distintas, uma por linha.');
        validate(form); return;
      }
    }
    if (page === 'categoria.html' || page === 'pesquisa.html') {
      const field = form.querySelector('#nome, #titulo');
      const key = field.value.trim().toLocaleLowerCase('pt-BR');
      if (key.length < (page === 'categoria.html' ? 2 : 3) || names.has(key)) {
        field.setCustomValidity('Informe um nome válido e diferente dos já usados nesta demonstração.');
        validate(form); return;
      }
      names.add(key);
    }
    if (page === 'senhas.html') {
      const quantity = Number(form.querySelector('#quantidade').value);
      const codes = Array.from({length: quantity}, () => {
        const bytes = crypto.getRandomValues(new Uint32Array(2));
        return `DEMO-${[...bytes].map(n => n.toString(16).padStart(8, '0')).join('')}`;
      });
      feedback(form, 'Códigos fictícios, sem validade de acesso e sem armazenamento:\n' + codes.join('\n'));
    } else if (page === 'solicitar-senha.html') {
      feedback(form, 'Código fictício: DEMO-2026. Abra “Responder questionário” no painel para experimentar. Nenhuma solicitação foi enviada.');
    } else if (page === 'relatorios.html') {
      const category = form.querySelector('#categoria').value;
      const dataset = {Todas: ['55', '82%', '13%', '5%'], Aluno: ['38', '79%', '16%', '5%'], Professor: ['17', '88%', '6%', '6%']};
      document.querySelectorAll('tbody td').forEach((cell, i) => { cell.textContent = dataset[category][i]; });
      document.querySelector('caption').textContent = `Indicadores fictícios — ${category}`;
      feedback(form, `Relatório de demonstração atualizado: ${category}. Valores fictícios independentes das respostas.`);
    } else {
      feedback(form, 'Demonstração concluída: os campos são válidos. Nenhum dado foi enviado ou salvo.');
    }
  });
}

function setupQuestionnaire(form) {
  const steps = [...form.querySelectorAll('[data-step]')];
  const previous = form.querySelector('#previous');
  const next = form.querySelector('#next');
  const finish = form.querySelector('#finish');
  const progress = form.querySelector('#step-progress');
  let index = 0;
  let completed = false;
  function show(focus = true) {
    steps.forEach((step, i) => { step.hidden = i !== index; });
    previous.disabled = index === 0;
    next.hidden = index === steps.length - 1;
    finish.hidden = index !== steps.length - 1;
    progress.textContent = `Etapa ${index + 1} de ${steps.length}`;
    if (focus) progress.focus();
  }
  function validStep() {
    const code = form.querySelector('#senha');
    if (index === 0) code.setCustomValidity(code.value.trim() === 'DEMO-2026' ? '' : 'Use o código fictício DEMO-2026.');
    return validate(form, [...steps[index].querySelectorAll('input, select, textarea')]);
  }
  function advance() {
    if (!validStep()) return;
    index += 1;
    form.querySelector('.form-feedback').textContent = '';
    show();
  }
  previous.addEventListener('click', () => { if (index > 0) { index -= 1; show(); } });
  next.addEventListener('click', advance);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (completed) return;
    if (index < steps.length - 1) { advance(); return; }
    for (let i = 0; i < steps.length; i++) {
      index = i;
      show(false);
      if (!validStep()) return;
    }
    completed = true;
    feedback(form, 'Demonstração concluída! Nenhuma resposta foi enviada ou armazenada. Recarregue a página para recomeçar.');
    for (const field of controls(form)) { field.value = ''; field.disabled = true; }
    for (const button of form.querySelectorAll('button')) button.disabled = true;
  });
  show(false);
}
