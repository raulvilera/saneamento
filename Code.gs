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
  if (params.action === 'save') {
    try {
      const payload = JSON.parse(params.payload || '{}');
      return jsonpOutput_(params.callback, saveResponse(payload));
    } catch (err) {
      return jsonpOutput_(params.callback, {ok: false, error: err.message});
    }
  }
  return jsonpOutput_(params.callback, {ok: false, error: 'Endpoint ativo. Use action=students para carregar alunos ou action=save para registrar respostas.'});
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

/** Retorna somente alunos com situação Ativo da aba Alunos. */
function getStudents() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(STUDENT_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const data = sh.getDataRange().getDisplayValues();
  const headers = data[0].map(normalize_);
  const index = headerIndex_(headers);
  return data.slice(1)
    .filter(row => normalize_(row[index.status]) === 'ativo')
    .map(row => ({
      turma: value_(row, index.turma), nome: value_(row, index.nome),
      ra: value_(row, index.ra), chamada: value_(row, index.chamada),
      email: value_(row, index.email)
    }))
    .filter(student => CLASS_SHEETS.indexOf(student.turma) >= 0 && student.nome);
}

/** Recebe o formulário e registra a resposta na aba correspondente à turma. */
function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) throw new Error('Nome e turma são obrigatórios.');
  if (CLASS_SHEETS.indexOf(payload.turma) < 0) throw new Error('Turma não autorizada.');
  const student = getStudents().find(s => s.turma === payload.turma && s.nome === payload.nome);
  if (!student) throw new Error('Aluno não encontrado ou não está com situação Ativo.');

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
  const find = names => {
    const index = names.map(normalize_).map(name => headers.indexOf(name)).find(i => i >= 0);
    if (index < 0) throw new Error('Coluna obrigatória não encontrada: ' + names.join(' / '));
    return index;
  };
  return {
    turma: find(['turma']), nome: find(['nome', 'nome do aluno']), ra: find(['ra']),
    chamada: find(['nº de chamada', 'n° de chamada', 'numero da chamada']),
    email: find(['email google', 'e-mail institucional', 'email institucional']),
    status: find(['situação do aluno', 'situacao do aluno'])
  };
}

function value_(row, index) { return String(row[index] || '').trim(); }
function normalize_(value) { return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function columnLetter_(column) { let output = ''; while (column > 0) { const remainder = (column - 1) % 26; output = String.fromCharCode(65 + remainder) + output; column = Math.floor((column - 1) / 26); } return output; }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Atividade 9º Ano').addItem('Preparar abas das turmas', 'setupActivity').addToUi();
}
