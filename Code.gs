const SPREADSHEET_ID = '1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU';
const RESPONSE_SHEET = 'Respostas';
const STUDENT_SHEET = 'Alunos';
const ANSWER_KEY = {q1:'B', q2:'B', q3:'A', q4:'B', q5:'B', q6:'A', q7:'A'};
const DEFAULT_STUDENTS_9A = [{"turma":"9º Ano A","nome":"ABRAHAM PAGES ROJO","ra":"000126699052"},{"turma":"9º Ano A","nome":"ALICE CARVALHO","ra":"000114160176"},{"turma":"9º Ano A","nome":"AMANDA PASSOS DE ALMEIDA","ra":"000115864899"},{"turma":"9º Ano A","nome":"ANA JÚLIA MENEZES DA SILVA","ra":"000115079886"},{"turma":"9º Ano A","nome":"ARTHUR COHEN BARRETO","ra":"000116651899"},{"turma":"9º Ano A","nome":"ARTHUR DAVI DE SOUZA FERNANDES","ra":"000115287899"},{"turma":"9º Ano A","nome":"BRENO GOUVEA NALIN","ra":"000115866442"},{"turma":"9º Ano A","nome":"DAVID HENRIQUE SILVA DOS SANTOS","ra":"000114253876"},{"turma":"9º Ano A","nome":"EDUARDA ALVES DE SOUZA","ra":"000115507309"},{"turma":"9º Ano A","nome":"EMANUEL ALVES OLIVEIRA","ra":"000112971413"},{"turma":"9º Ano A","nome":"ESTHER CRISTINE SILVA RIBEIRO","ra":"000113216026"},{"turma":"9º Ano A","nome":"EVELLYN ALVES DA SILVA","ra":"000121483284"},{"turma":"9º Ano A","nome":"EVELLYN YASMIN TAVARES SILVA","ra":"000120570957"},{"turma":"9º Ano A","nome":"FELIPE DE SOUZA RODRIGUES","ra":"000115879478"},{"turma":"9º Ano A","nome":"FERNANDA POLACHINI MAYER GOMES MARQUES","ra":"000113220165"},{"turma":"9º Ano A","nome":"GUSTAVO AUGUSTO TOMBOLO REIS","ra":"000121486964"},{"turma":"9º Ano A","nome":"HINGRID SARAIVA DOS SANTOS","ra":"000115343277"},{"turma":"9º Ano A","nome":"IGOR MARTINS PEREIRA","ra":"000115083615"},{"turma":"9º Ano A","nome":"ISABELLA DOS SANTOS SALDANHA","ra":"000115076210"},{"turma":"9º Ano A","nome":"KAUANNY APARECIDA MALAQUIAS LIMA","ra":"000115077275"},{"turma":"9º Ano A","nome":"KÉTHILY NAYARA DA SILVA","ra":"000114160080"},{"turma":"9º Ano A","nome":"LEONARDO DE AVELAR CARVALHO","ra":"000115077491"},{"turma":"9º Ano A","nome":"LIVIA OLIVEIRA NASCIMENTO","ra":"000116528242"},{"turma":"9º Ano A","nome":"LOHRAN ROMUALDO MENDES DA SILVA","ra":"000115885441"},{"turma":"9º Ano A","nome":"LUANA KAROLINE MARTINS DE OLIVEIRA","ra":"000114150635"},{"turma":"9º Ano A","nome":"LUIS MIGUEL GONÇALVES DA SILVA","ra":"000123848645"},{"turma":"9º Ano A","nome":"MANUELLA DE MORAES SOUZA","ra":"000114143738"},{"turma":"9º Ano A","nome":"MARCELA ROBERTO DE OLIVEIRA","ra":"000115077815"},{"turma":"9º Ano A","nome":"MATHEUS TURCHETTO","ra":"000113210966"},{"turma":"9º Ano A","nome":"MELISSA VICTORIA DE OLIVEIRA CARVALHO","ra":"000115887628"},{"turma":"9º Ano A","nome":"MIGUEL MARTINS DE ASSIS","ra":"000113221116"},{"turma":"9º Ano A","nome":"OMRAN RASEKH","ra":"000124600717"},{"turma":"9º Ano A","nome":"PATRICIA SEGURA","ra":"000115077465"},{"turma":"9º Ano A","nome":"RAUL HENRIQUE CRUS BAPTISTA","ra":"000114169380"},{"turma":"9º Ano A","nome":"SARAH VITORIA ALVES OLIVEIRA","ra":"000115077243"},{"turma":"9º Ano A","nome":"YURI GABRIEL DE MORAES PONGOLINO","ra":"000115077239"},{"turma":"9º Ano A","nome":"ZAYN AL ABIDIN RASULI","ra":"000125460635"}];
const DEFAULT_STUDENTS_9B = [{"turma":"9º Ano B","nome":"ALEJANDRO VIEIRA LIMA","ra":"123944559"},{"turma":"9º Ano B","nome":"ALLAN BEZERRA DE LIMA","ra":"115081749"},{"turma":"9º Ano B","nome":"ALYSON DANIEL OLIVEIRA HERCULE","ra":"114151286"},{"turma":"9º Ano B","nome":"ANA BEATRIZ RODRIGUES OLIVEIRA","ra":"115077002"},{"turma":"9º Ano B","nome":"ANA CLARA GONCALVES TORRES LOYOLA","ra":"114150864"},{"turma":"9º Ano B","nome":"ANNA BEATRIZ SANTIAGO DA SILVA","ra":"114143887"},{"turma":"9º Ano B","nome":"CAIO FELIPE NOGUEIRA DOS SANTOS","ra":"114799576"},{"turma":"9º Ano B","nome":"CHRISTOFER FELIPY SANTOS FONSECA","ra":"115079892"},{"turma":"9º Ano B","nome":"DANILO SANTOS CONCEIÇÃO","ra":"126628157"},{"turma":"9º Ano B","nome":"ELIAS SILVA DE LIMA","ra":"113219156"},{"turma":"9º Ano B","nome":"EVERTON HENRIQUE CARMO RODRIGUES","ra":"115079887"},{"turma":"9º Ano B","nome":"FABIO HENRIQUE DA SILVA","ra":"115083361"},{"turma":"9º Ano B","nome":"GABRIELA SOUSA DA SILVA","ra":"113205806"},{"turma":"9º Ano B","nome":"GABRIELA VITORIA SEVERA LINS","ra":"113215338"},{"turma":"9º Ano B","nome":"IAGO ANJOS DE JESUS","ra":"110380420"},{"turma":"9º Ano B","nome":"JAQUELYNE PEREIRA GONCALVES","ra":"115080476"},{"turma":"9º Ano B","nome":"JENNYFER VITÓRIA BASILIO GOMES","ra":"114150446"},{"turma":"9º Ano B","nome":"JULIO CESAR ALVES DOS SANTOS","ra":"115883182"},{"turma":"9º Ano B","nome":"KAIKE GABRIEL MORAIS","ra":"115077126"},{"turma":"9º Ano B","nome":"KYARA MANUELLA CAXIADO DE LUCENA","ra":"114152060"},{"turma":"9º Ano B","nome":"LEONARDO MENOIA","ra":"113222398"},{"turma":"9º Ano B","nome":"LORENA ALEXANDRE SANTOS DA SILVA","ra":"112526618"},{"turma":"9º Ano B","nome":"LUAN VENITES BALBINO","ra":"116528496"},{"turma":"9º Ano B","nome":"MANUELLA LELIS DA SILVA SIMAO","ra":"114156063"},{"turma":"9º Ano B","nome":"MARIA EDUARDA FELIX DA SILVA","ra":"116516696"},{"turma":"9º Ano B","nome":"MUNIQUE CRISTINA LUCAS","ra":"115077229"},{"turma":"9º Ano B","nome":"NICOLAS PENTEADO","ra":"121492136"},{"turma":"9º Ano B","nome":"NICOLY VITÓRIA SANTOS DE MENEZES","ra":"114151751"},{"turma":"9º Ano B","nome":"PAULO CELSO DA COSTA JUNIOR","ra":"116519133"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE CARLOS LIMA","ra":"113032173"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE MORAIS AMORIM","ra":"114164724"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE OLIVEIRA GOMES","ra":"114167923"},{"turma":"9º Ano B","nome":"PIETRO RODRIGUES MIRANDA","ra":"114161023"},{"turma":"9º Ano B","nome":"RAPHAELLY APARECIDA MARINHO DE OLIVEIRA","ra":"115889727"},{"turma":"9º Ano B","nome":"RENAN LEANDRO RODRIGUES VICENTE","ra":"115889926"},{"turma":"9º Ano B","nome":"RENATO SOUZA SANTOS","ra":"115079665"},{"turma":"9º Ano B","nome":"RODOLFO RAFAEL GOLZENLEUCHTER MORENO JUNIOR","ra":"112587537"},{"turma":"9º Ano B","nome":"SOPHIA MENEZES DE ARAUJO","ra":"115074913"},{"turma":"9º Ano B","nome":"THAYNA SEABRA DE OLIVEIRA DO NASCIMENTO","ra":"115079570"},{"turma":"9º Ano B","nome":"VITÓRIA MENEZES BRANDÃO","ra":"114255506"},{"turma":"9º Ano B","nome":"WENDELL RAFAEL DE JESUS LESSA","ra":"114163782"},{"turma":"9º Ano B","nome":"WILHAN KENJI ANTONIO","ra":"121490075"}];
const DEFAULT_STUDENTS_9B = [{"turma":"9º Ano B","nome":"ALEJANDRO VIEIRA LIMA","ra":"123944559"},{"turma":"9º Ano B","nome":"ALLAN BEZERRA DE LIMA","ra":"115081749"},{"turma":"9º Ano B","nome":"ALYSON DANIEL OLIVEIRA HERCULE","ra":"114151286"},{"turma":"9º Ano B","nome":"ANA BEATRIZ RODRIGUES OLIVEIRA","ra":"115077002"},{"turma":"9º Ano B","nome":"ANA CLARA GONCALVES TORRES LOYOLA","ra":"114150864"},{"turma":"9º Ano B","nome":"ANNA BEATRIZ SANTIAGO DA SILVA","ra":"114143887"},{"turma":"9º Ano B","nome":"CAIO FELIPE NOGUEIRA DOS SANTOS","ra":"114799576"},{"turma":"9º Ano B","nome":"CHRISTOFER FELIPY SANTOS FONSECA","ra":"115079892"},{"turma":"9º Ano B","nome":"DANILO SANTOS CONCEIÇÃO","ra":"126628157"},{"turma":"9º Ano B","nome":"ELIAS SILVA DE LIMA","ra":"113219156"},{"turma":"9º Ano B","nome":"EVERTON HENRIQUE CARMO RODRIGUES","ra":"115079887"},{"turma":"9º Ano B","nome":"FABIO HENRIQUE DA SILVA","ra":"115083361"},{"turma":"9º Ano B","nome":"GABRIELA SOUSA DA SILVA","ra":"113205806"},{"turma":"9º Ano B","nome":"GABRIELA VITORIA SEVERA LINS","ra":"113215338"},{"turma":"9º Ano B","nome":"IAGO ANJOS DE JESUS","ra":"110380420"},{"turma":"9º Ano B","nome":"JAQUELYNE PEREIRA GONCALVES","ra":"115080476"},{"turma":"9º Ano B","nome":"JENNYFER VITÓRIA BASILIO GOMES","ra":"114150446"},{"turma":"9º Ano B","nome":"JULIO CESAR ALVES DOS SANTOS","ra":"115883182"},{"turma":"9º Ano B","nome":"KAIKE GABRIEL MORAIS","ra":"115077126"},{"turma":"9º Ano B","nome":"KYARA MANUELLA CAXIADO DE LUCENA","ra":"114152060"},{"turma":"9º Ano B","nome":"LEONARDO MENOIA","ra":"113222398"},{"turma":"9º Ano B","nome":"LORENA ALEXANDRE SANTOS DA SILVA","ra":"112526618"},{"turma":"9º Ano B","nome":"LUAN VENITES BALBINO","ra":"116528496"},{"turma":"9º Ano B","nome":"MANUELLA LELIS DA SILVA SIMAO","ra":"114156063"},{"turma":"9º Ano B","nome":"MARIA EDUARDA FELIX DA SILVA","ra":"116516696"},{"turma":"9º Ano B","nome":"MUNIQUE CRISTINA LUCAS","ra":"115077229"},{"turma":"9º Ano B","nome":"NICOLAS PENTEADO","ra":"121492136"},{"turma":"9º Ano B","nome":"NICOLY VITÓRIA SANTOS DE MENEZES","ra":"114151751"},{"turma":"9º Ano B","nome":"PAULO CELSO DA COSTA JUNIOR","ra":"116519133"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE CARLOS LIMA","ra":"113032173"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE MORAIS AMORIM","ra":"114164724"},{"turma":"9º Ano B","nome":"PEDRO HENRIQUE OLIVEIRA GOMES","ra":"114167923"},{"turma":"9º Ano B","nome":"PIETRO RODRIGUES MIRANDA","ra":"114161023"},{"turma":"9º Ano B","nome":"RAPHAELLY APARECIDA MARINHO DE OLIVEIRA","ra":"115889727"},{"turma":"9º Ano B","nome":"RENAN LEANDRO RODRIGUES VICENTE","ra":"115889926"},{"turma":"9º Ano B","nome":"RENATO SOUZA SANTOS","ra":"115079665"},{"turma":"9º Ano B","nome":"RODOLFO RAFAEL GOLZENLEUCHTER MORENO JUNIOR","ra":"112587537"},{"turma":"9º Ano B","nome":"SOPHIA MENEZES DE ARAUJO","ra":"115074913"},{"turma":"9º Ano B","nome":"THAYNA SEABRA DE OLIVEIRA DO NASCIMENTO","ra":"115079570"},{"turma":"9º Ano B","nome":"VITÓRIA MENEZES BRANDÃO","ra":"114255506"},{"turma":"9º Ano B","nome":"WENDELL RAFAEL DE JESUS LESSA","ra":"114163782"},{"turma":"9º Ano B","nome":"WILHAN KENJI ANTONIO","ra":"121490075"}];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Atividade de Ciências – 9º Ano')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getStudents() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(STUDENT_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const lastCol = sh.getLastColumn();
  const headers = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(h => String(h).trim().toLowerCase());
  const col = name => headers.indexOf(name);
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, lastCol).getDisplayValues();
  return values.filter(r => r[0] && (col('situação do aluno') < 0 || String(r[col('situação do aluno')]).trim().toLowerCase() === 'ativo')).map(r => ({turma:String(r[col('turma')] >= 0 ? r[col('turma')] : r[0]).trim(), nome:String(r[col('nome')] >= 0 ? r[col('nome')] : r[1]).trim(), ra:String(r[col('ra')] >= 0 ? r[col('ra')] : r[2] || '').trim(), chamada:String(r[col('nº de chamada')] >= 0 ? r[col('nº de chamada')] : '').trim(), email:String(r[col('email google')] >= 0 ? r[col('email google')] : r[col('e-mail institucional')] >= 0 ? r[col('e-mail institucional')] : '').trim()}));
}

function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) throw new Error('Nome e turma são obrigatórios.');
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(RESPONSE_SHEET);
  if (!sh) sh = ss.insertSheet(RESPONSE_SHEET);
  const headers = ['Data/hora','Data da atividade','Nome','Turma','RA','E-mail institucional','Nº da chamada','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8 – resposta dissertativa','Q9 – resposta dissertativa','Q10 – resposta dissertativa','Nota objetiva','Status da correção'];
  if (sh.getLastRow() === 0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  const a = payload.answers || {};
  const objectiveScore = Object.keys(ANSWER_KEY).reduce((sum,q) => sum + (String(a[q] || '').toUpperCase() === ANSWER_KEY[q] ? 1 : 0), 0);
  sh.appendRow([new Date(), payload.data || '', payload.nome, payload.turma, payload.ra || '', payload.email || '', payload.chamada || '', a.q1||'',a.q2||'',a.q3||'',a.q4||'',a.q5||'',a.q6||'',a.q7||'',a.q8||'',a.q9||'',a.q10||'',objectiveScore,'Dissertativas aguardando correção']);
  applyFormatting_(sh);
  return {message: 'Atividade registrada com sucesso. A nota objetiva foi salva; as questões dissertativas serão corrigidas pelo professor.'};
}

function setupActivity() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let students = ss.getSheetByName(STUDENT_SHEET);
  if (!students) students = ss.insertSheet(STUDENT_SHEET);
  if (students.getLastRow() === 0) students.getRange('A1:G1').setValues([['Turma','Nome','RA','Nº de chamada','E-mail Google','Situação do Aluno','Observação']]);
  students.setFrozenRows(1);
  students.getRange('A1:G1').setFontWeight('bold').setBackground('#14324a').setFontColor('#ffffff');
  let responses = ss.getSheetByName(RESPONSE_SHEET);
  if (!responses) responses = ss.insertSheet(RESPONSE_SHEET);
  const headers = ['Data/hora','Data da atividade','Nome','Turma','RA','E-mail institucional','Nº da chamada','Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8 – resposta dissertativa','Q9 – resposta dissertativa','Q10 – resposta dissertativa','Nota objetiva','Status da correção'];
  if (responses.getLastRow() === 0) responses.getRange(1,1,1,headers.length).setValues([headers]);
  responses.setFrozenRows(1); responses.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#14324a').setFontColor('#ffffff');
  applyFormatting_(responses);
  responses.autoResizeColumns(1, headers.length);
  return 'Configuração concluída. Preencha a aba Alunos com Turma, Nome e RA e publique como aplicativo da web.';
}

function applyFormatting_(sh) {
  const firstDataRow = 2, lastRow = Math.max(sh.getLastRow(), firstDataRow);
  if (lastRow < firstDataRow) return;
  const objectiveCols = [8,9,10,11,12,13,14];
  objectiveCols.forEach((col, i) => {
    const letter = String.fromCharCode(65 + col - 1);
    const key = ANSWER_KEY['q' + (i+1)];
    const range = sh.getRange(`${letter}${firstDataRow}:${letter}${lastRow}`);
    const rules = sh.getConditionalFormatRules().filter(r => !r.getRanges().some(x => x.getA1Notation() === range.getA1Notation()));
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(key).setBackground('#9ccaf7').setFontColor('#073b73').setRanges([range]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(`=AND(${letter}${firstDataRow}<>"",${letter}${firstDataRow}<>"${key}")`).setBackground('#f4aaaa').setFontColor('#8b1e1e').setRanges([range]).build());
    sh.setConditionalFormatRules(rules);
  });
  sh.getRange(`P${firstDataRow}:R${lastRow}`).setBackground('#fff4cc');
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Atividade 9º Ano').addItem('Preparar planilha','setupActivity').addToUi();
}
