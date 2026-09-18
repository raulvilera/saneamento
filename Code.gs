const SPREADSHEET_ID = '1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU';
const RESPONSE_SHEET = 'Respostas';
const STUDENT_SHEET = 'Alunos';
const ANSWER_KEY = {q1:'B', q2:'B', q3:'A', q4:'B', q5:'B', q6:'A', q7:'A'};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Atividade de Ciências – 9º Ano')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStudents() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(STUDENT_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, Math.max(3, sh.getLastColumn())).getDisplayValues();
  return values.filter(r => r[0]).map(r => ({turma: String(r[0]).trim(), nome: String(r[1]).trim(), ra: String(r[2] || '').trim()}));
}

function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) throw new Error('Nome e turma são obrigatórios.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(RESPONSE_SHEET);
  if (!sh) sh = ss.insertSheet(RESPONSE_SHEET);
  const headers = ['Data/hora','Nome','Turma','RA','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8 – resposta dissertativa','Q9 – resposta dissertativa','Q10 – resposta dissertativa','Nota objetiva','Status da correção'];
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  const a = payload.answers || {};
  const objectiveScore = Object.keys(ANSWER_KEY).reduce((sum,q) => sum + (String(a[q] || '').toUpperCase() === ANSWER_KEY[q] ? 1 : 0), 0);
  sh.appendRow([new Date(), payload.nome, payload.turma, payload.ra || '', a.q1||'',a.q2||'',a.q3||'',a.q4||'',a.q5||'',a.q6||'',a.q7||'',a.q8||'',a.q9||'',a.q10||'',objectiveScore,'Dissertativas aguardando correção']);
  applyFormatting_(sh);
  return {message: 'Atividade registrada com sucesso. A nota objetiva foi salva; as questões dissertativas serão corrigidas pelo professor.'};
}

function setupActivity() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let students = ss.getSheetByName(STUDENT_SHEET);
  if (!students) students = ss.insertSheet(STUDENT_SHEET);
  if (students.getLastRow() === 0) students.getRange('A1:C1').setValues([['Turma','Nome','RA']]);
  students.setFrozenRows(1);
  students.getRange('A1:C1').setFontWeight('bold').setBackground('#14324a').setFontColor('#ffffff');
  let responses = ss.getSheetByName(RESPONSE_SHEET);
  if (!responses) responses = ss.insertSheet(RESPONSE_SHEET);
  const headers = ['Data/hora','Nome','Turma','RA','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8 – resposta dissertativa','Q9 – resposta dissertativa','Q10 – resposta dissertativa','Nota objetiva','Status da correção'];
  if (responses.getLastRow() === 0) responses.getRange(1,1,1,headers.length).setValues([headers]);
  responses.setFrozenRows(1); responses.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#14324a').setFontColor('#ffffff');
  applyFormatting_(responses);
  responses.autoResizeColumns(1, headers.length);
  return 'Configuração concluída. Preencha a aba Alunos com Turma, Nome e RA e publique como aplicativo da web.';
}

function applyFormatting_(sh) {
  const firstDataRow = 2, lastRow = Math.max(sh.getLastRow(), firstDataRow);
  if (lastRow < firstDataRow) return;
  const objectiveCols = [5,6,7,8,9,10,11];
  objectiveCols.forEach((col, i) => {
    const letter = String.fromCharCode(65 + col - 1);
    const key = ANSWER_KEY['q' + (i+1)];
    const range = sh.getRange(`${letter}${firstDataRow}:${letter}${lastRow}`);
    const rules = sh.getConditionalFormatRules().filter(r => !r.getRanges().some(x => x.getA1Notation() === range.getA1Notation()));
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(key).setBackground('#9ccaf7').setFontColor('#073b73').setRanges([range]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=AND(${letter}${firstDataRow}<>"",${letter}${firstDataRow}<>"${key}")`).setBackground('#f4aaaa').setFontColor('#8b1e1e').setRanges([range]).build());
    sh.setConditionalFormatRules(rules);
  });
  sh.getRange(`L${firstDataRow}:N${lastRow}`).setBackground('#fff4cc');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Atividade 9º Ano').addItem('Preparar planilha','setupActivity').addToUi();
}
