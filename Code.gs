/**
 * ATIVIDADE DE CIÊNCIAS – 9º ANO
 * Versão sem integração com IA e sem chamadas externas.
 * As 7 objetivas são corrigidas automaticamente.
 * As 3 dissertativas recebem nota manual de 0 a 1 pelo professor.
 * A nota final é calculada automaticamente de 0 a 10.
 *
 * Configuração:
 * 1. Cole este arquivo no projeto Apps Script da planilha.
 * 2. Execute setupActivity() uma vez e autorize o projeto.
 * 3. Publique como aplicativo da web para o formulário usar google.script.run.
 */

const SPREADSHEET_ID = '1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU';
const STUDENT_SHEET = 'Alunos';
const CLASS_SHEETS = ['9º Ano A', '9º Ano B'];
const ANSWER_KEY = { q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'B', q6: 'A', q7: 'A' };

function doGet(e) {
  const params = (e && e.parameter) || {};
  if (params.action === 'students') {
    return jsonpOutput_(params.callback, getStudents());
  }
  if (['save', 'submit', 'respostas', 'submitResponse'].indexOf(params.action) >= 0) {
    try {
      const rawPayload = params.payload || params.data || params.body || '{}';
      const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      return jsonpOutput_(params.callback, saveResponse(payload));
    } catch (err) {
      return jsonpOutput_(params.callback, {ok: false, error: err.message});
    }
  }
  return jsonpOutput_(params.callback, {ok: false, error: 'Ação desconhecida. Use action=students ou action=save.'});
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    return jsonOutput_(saveResponse(payload));
  } catch (err) {
    return jsonOutput_({ok: false, error: err.message});
  }
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonpOutput_(callback, data) {
  const safeCallback = String(callback || 'handleAppsScriptResponse').replace(/[^a-zA-Z0-9_$]/g, '');
  return ContentService.createTextOutput(safeCallback + '(' + JSON.stringify(data) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/** Retorna somente alunos ativos, aceitando cabeçalhos após linhas de metadados. */
function getStudents() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetNames = [STUDENT_SHEET].concat(CLASS_SHEETS);
  const students = [];
  const seen = {};
  sheetNames.forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 1) return;
    const values = sh.getDataRange().getDisplayValues();
    const headerRow = findHeaderRow_(values);
    if (headerRow < 0) return;
    const headers = values[headerRow].map(normalize_);
    const index = headerIndex_(headers);
    values.slice(headerRow + 1).forEach(row => {
      if (normalize_(value_(row, index.status)) !== 'ativo') return;
      const student = {
        turma: index.turma >= 0 ? value_(row, index.turma) : sheetName,
        nome: value_(row, index.nome),
        ra: value_(row, index.ra),
        chamada: value_(row, index.chamada),
        email: value_(row, index.email)
      };
      if (!student.nome || !CLASS_SHEETS.some(className => sameClass_(student.turma, className))) return;
      const key = normalizeKey_(student.turma) + '|' + normalizeKey_(student.nome) + '|' + normalizeKey_(student.ra);
      if (!seen[key]) { seen[key] = true; students.push(student); }
    });
  });
  return students;
}

function findHeaderRow_(values) {
  for (let r = 0; r < Math.min(values.length, 30); r++) {
    const row = values[r].map(normalize_);
    const hasName = row.indexOf('nome do aluno') >= 0 || row.indexOf('nome') >= 0;
    const hasStatus = row.indexOf('situacao do aluno') >= 0 || row.indexOf('situacao') >= 0 || row.indexOf('status') >= 0;
    if (hasName && hasStatus) return r;
  }
  return -1;
}

/** Recebe o formulário e registra a resposta na aba correspondente à turma. */
function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) throw new Error('Nome e turma são obrigatórios.');
  if (!CLASS_SHEETS.some(className => sameClass_(className, payload.turma))) throw new Error('Turma não autorizada.');
  // O dropdown já é carregado somente com alunos ativos. No salvamento,
  // usamos os dados selecionados pelo aluno para não bloquear por diferenças
  // de estrutura entre abas, acentos ou formatação do RA.
  const student = {
    nome: String(payload.nome || '').trim(),
    turma: String(payload.turma || '').trim(),
    ra: String(payload.ra || '').trim(),
    email: String(payload.email || '').trim(),
    chamada: String(payload.chamada || '').trim()
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateClassSheet_(ss, payload.turma);
    const answers = payload.answers || {};
    const objective = gradeObjective_(answers);
    const now = new Date();
    const row = [
      now, Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy'),
      student.nome, student.turma, student.ra, student.email, student.chamada,
      answers.q1 || '', answers.q2 || '', answers.q3 || '', answers.q4 || '', answers.q5 || '', answers.q6 || '', answers.q7 || '',
      answers.q8 || '', answers.q9 || '', answers.q10 || '', objective.score,
      '', '', '', '', 'Aguardando correção manual', '', '', ''
    ];
    sh.appendRow(row);
    const lastRow = sh.getLastRow();
    sh.getRange(lastRow, 22).setFormula(`=IF(COUNTA(S${lastRow}:U${lastRow})=3,R${lastRow}+SUM(S${lastRow}:U${lastRow}),"")`);
    formatResponseSheet_(sh);
    sh.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('top');
    return { ok: true, message: 'Resposta registrada. A nota objetiva foi calculada; as dissertativas aguardam correção manual.' };
  } finally {
    lock.releaseLock();
  }
}

/** Cria as abas das turmas e aplica os cabeçalhos sem apagar respostas existentes. */
function setupActivity() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  CLASS_SHEETS.forEach(name => formatResponseSheet_(getOrCreateClassSheet_(ss, name)));
  return 'Abas 9º Ano A e 9º Ano B preparadas sem correção por IA.';
}

function getOrCreateClassSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const headers = [
    'Data/hora', 'Data', 'Nome', 'Turma', 'RA', 'E-mail institucional', 'Nº chamada',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7',
    'Q8 – dissertativa', 'Q9 – dissertativa', 'Q10 – dissertativa',
    'Nota objetivas', 'Nota Q8 manual', 'Nota Q9 manual', 'Nota Q10 manual', 'Nota final',
    'Status da correção', 'Observação Q8', 'Observação Q9', 'Observação Q10'
  ];
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function formatResponseSheet_(sh) {
  const lastCol = 26;
  const lastRow = Math.max(sh.getLastRow(), 2);
  const bodyRows = Math.max(1, lastRow - 1);
  sh.getRange(1, 1, 1, lastCol).setFontWeight('bold').setFontColor('#ffffff').setBackground('#14324a').setWrap(true);
  sh.setFrozenRows(1);
  sh.getRange(2, 1, bodyRows, lastCol).setWrap(true);
  sh.getRange(2, 18, bodyRows, 5).setNumberFormat('0.0');
  sh.getRange(2, 18, bodyRows, 5).setBackground('#fff4cc');
  sh.getRange(2, 19, bodyRows, 3).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1).setAllowInvalid(false).build()
  );

  // Respostas corretas em azul; incorretas em vermelho.
  const rules = [];
  Object.keys(ANSWER_KEY).forEach((q, i) => {
    const col = 8 + i;
    const letter = columnLetter_(col);
    const range = sh.getRange(2, col, bodyRows, 1);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=UPPER(${letter}2)="${ANSWER_KEY[q]}"`)
      .setBackground('#9ccaf7').setFontColor('#073b73').setRanges([range]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(`=AND(${letter}2<>"",UPPER(${letter}2)<>"${ANSWER_KEY[q]}")`)
      .setBackground('#f4aaaa').setFontColor('#8b1e1e').setRanges([range]).build());
  });
  sh.setConditionalFormatRules(rules);
  sh.autoResizeColumns(1, lastCol);
  sh.setColumnWidths(15, 3, 260);
  sh.setColumnWidths(24, 3, 260);
}

function gradeObjective_(answers) {
  let score = 0;
  Object.keys(ANSWER_KEY).forEach(q => {
    if (String(answers[q] || '').trim().toUpperCase() === ANSWER_KEY[q]) score += 1;
  });
  return { score: score };
}

function headerIndex_(headers) {
  const findOptional = names => {
    const index = names.map(normalize_).map(name => headers.indexOf(name)).find(i => i >= 0);
    return index === undefined ? -1 : index;
  };
  const required = (names, label) => {
    const index = findOptional(names);
    if (index < 0) throw new Error('Coluna obrigatória não encontrada: ' + label);
    return index;
  };
  return {
    turma: findOptional(['turma', 'classe', 'sala']),
    nome: required(['nome do aluno', 'nome'], 'Nome do Aluno'),
    ra: required(['ra', 'registro do aluno'], 'RA'),
    chamada: required(['nº de chamada', 'n° de chamada', 'numero da chamada', 'chamada'], 'Nº de chamada'),
    email: required(['email google', 'e-mail institucional', 'email institucional', 'e-mail', 'email'], 'Email Google'),
    status: required(['situação do aluno', 'situacao do aluno', 'situação', 'situacao', 'status'], 'Situação do Aluno')
  };
}

function value_(row, index) { return String(row[index] || '').trim(); }
function normalize_(value) { return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function normalizeKey_(value) { return normalize_(value).replace(/[^a-z0-9]+/g, ''); }
function sameClass_(a, b) { return normalizeKey_(a).replace('9ano','9') === normalizeKey_(b).replace('9ano','9'); }
function columnLetter_(column) { let output = ''; while (column > 0) { const remainder = (column - 1) % 26; output = String.fromCharCode(65 + remainder) + output; column = Math.floor((column - 1) / 26); } return output; }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Atividade 9º Ano').addItem('Preparar abas das turmas', 'setupActivity').addToUi();
}
