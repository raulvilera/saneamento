/**
 * ATIVIDADE DE CIÊNCIAS – 9º ANO
 * As 7 questões objetivas são corrigidas automaticamente.
 * As 3 dissertativas recebem nota manual de 0 a 1 pelo professor.
 * A nota final é calculada automaticamente (0 a 10).
 * As respostas são registradas nas respectivas abas de cada turma ("9º Ano A", "9º Ano B").
 */

const SPREADSHEET_ID = '1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU';
const STUDENT_SHEET = 'Alunos';
const CLASS_SHEETS = ['9º Ano A', '9º Ano B'];
const ANSWER_KEY = { q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'B', q6: 'A', q7: 'A' };

// ========== REQUISIÇÕES GET (Carregador de alunos e verificação de status) ==========
function doGet(e) {
  const params = (e && e.parameter) || {};

  // Retorna lista de alunos para o dropdown do formulário
  if (params.action === 'students') {
    const students = getStudents();
    if (params.callback) {
      const safeCb = String(params.callback).replace(/[^a-zA-Z0-9_$]/g, '');
      return ContentService.createTextOutput(safeCb + '(' + JSON.stringify(students) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(JSON.stringify(students))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Permite salvar via GET se necessário
  if (['save', 'submit', 'respostas', 'submitResponse'].indexOf(params.action) >= 0) {
    try {
      const rawPayload = params.payload || params.data || params.body || '{}';
      const payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
      const result = saveResponse(payload);
      if (params.callback) {
        const safeCb = String(params.callback).replace(/[^a-zA-Z0-9_$]/g, '');
        return ContentService.createTextOutput(safeCb + '(' + JSON.stringify(result) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      const errRes = { ok: false, error: err.message };
      if (params.callback) {
        const safeCb = String(params.callback).replace(/[^a-zA-Z0-9_$]/g, '');
        return ContentService.createTextOutput(safeCb + '(' + JSON.stringify(errRes) + ')')
          .setMimeType(ContentService.MimeType.JAVASCRIPT);
      }
      return ContentService.createTextOutput(JSON.stringify(errRes))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'API Atividade 9º Ano ativa.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========== REQUISIÇÕES POST (Envio de respostas do formulário) ==========
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const result = saveResponse(payload);
    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      message: result.message
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Erro em doPost: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== CARREGAR LISTA DE ALUNOS ATIVOS ==========
function getStudents() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const students = [];
    const seen = {};

    // Procura na aba "Alunos" e nas abas de cada turma
    const sheetNames = [STUDENT_SHEET].concat(CLASS_SHEETS);

    sheetNames.forEach(sheetName => {
      const sh = ss.getSheetByName(sheetName);
      if (!sh || sh.getLastRow() < 2) return;

      const data = sh.getDataRange().getDisplayValues();
      if (data.length < 2) return;

      let headerRow = -1;
      let colMap = { nome: -1, turma: -1, ra: -1, status: -1, chamada: -1, email: -1 };

      for (let r = 0; r < Math.min(data.length, 10); r++) {
        const rowNorm = data[r].map(normalizeText_);
        const idxNome = rowNorm.findIndex(c => c.includes('nome'));
        if (idxNome >= 0) {
          headerRow = r;
          colMap.nome = idxNome;
          colMap.turma = rowNorm.findIndex(c => c.includes('turma') || c.includes('sala') || c.includes('classe'));
          colMap.ra = rowNorm.findIndex(c => c === 'ra' || c.includes('registro'));
          colMap.status = rowNorm.findIndex(c => c.includes('situa') || c.includes('status'));
          colMap.chamada = rowNorm.findIndex(c => c.includes('chamada'));
          colMap.email = rowNorm.findIndex(c => c.includes('email') || c.includes('e-mail'));
          break;
        }
      }

      if (headerRow === -1 || colMap.nome === -1) return;

      for (let r = headerRow + 1; r < data.length; r++) {
        const row = data[r];
        const nome = String(row[colMap.nome] || '').trim();
        if (!nome) continue;

        if (colMap.status >= 0) {
          const st = normalizeText_(row[colMap.status]);
          if (st && !st.includes('ativo')) continue;
        }

        const rawTurma = colMap.turma >= 0 && row[colMap.turma]
          ? String(row[colMap.turma]).trim()
          : sheetName;

        const resolvedTurma = resolveClassName_(rawTurma);
        const ra = colMap.ra >= 0 ? String(row[colMap.ra]).trim() : '';
        const key = normalizeText_(resolvedTurma) + '|' + normalizeText_(nome);

        if (!seen[key]) {
          seen[key] = true;
          students.push({
            turma: resolvedTurma,
            nome: nome,
            ra: ra,
            chamada: colMap.chamada >= 0 ? String(row[colMap.chamada]).trim() : '',
            email: colMap.email >= 0 ? String(row[colMap.email]).trim() : ''
          });
        }
      }
    });

    return students;
  } catch (err) {
    Logger.log('Erro ao carregar alunos: ' + err.message);
    return [];
  }
}

// ========== SALVAR RESPOSTA NA ABA DA RESPECTIVA TURMA ==========
function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) {
    throw new Error('Nome e turma são obrigatórios.');
  }

  // Identifica a aba exata correspondente ("9º Ano A" ou "9º Ano B")
  const targetSheetName = resolveClassName_(payload.turma);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateClassSheet_(ss, targetSheetName);

    const answers = payload.answers || {};
    const objectiveScore = Object.keys(ANSWER_KEY).reduce((sum, q) => {
      const userAns = String(answers[q] || '').trim().toUpperCase();
      return userAns === ANSWER_KEY[q] ? sum + 1 : sum;
    }, 0);

    const now = new Date();
    const dataFormatada = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');

    // Monta a linha com 26 colunas estruturadas
    const row = [
      now,                                     // Col A: Data/hora
      dataFormatada,                           // Col B: Data
      String(payload.nome || '').trim(),       // Col C: Nome
      targetSheetName,                         // Col D: Turma
      String(payload.ra || '').trim(),         // Col E: RA
      String(payload.email || '').trim(),      // Col F: E-mail
      String(payload.chamada || '').trim(),    // Col G: Nº chamada
      answers.q1 || '',                        // Col H: Q1
      answers.q2 || '',                        // Col I: Q2
      answers.q3 || '',                        // Col J: Q3
      answers.q4 || '',                        // Col K: Q4
      answers.q5 || '',                        // Col L: Q5
      answers.q6 || '',                        // Col M: Q6
      answers.q7 || '',                        // Col N: Q7
      answers.q8 || '',                        // Col O: Q8 dissertativa
      answers.q9 || '',                        // Col P: Q9 dissertativa
      answers.q10 || '',                       // Col Q: Q10 dissertativa
      objectiveScore,                          // Col R: Nota objetivas (0-7)
      '',                                      // Col S: Nota Q8 manual (0 a 1)
      '',                                      // Col T: Nota Q9 manual (0 a 1)
      '',                                      // Col U: Nota Q10 manual (0 a 1)
      '',                                      // Col V: Nota final (calculada por fórmula)
      'Aguardando correção manual',            // Col W: Status da correção
      '',                                      // Col X: Observação Q8
      '',                                      // Col Y: Observação Q9
      ''                                       // Col Z: Observação Q10
    ];

    sh.appendRow(row);
    const lastRow = sh.getLastRow();

    // Fórmula para nota final: Nota objetiva (R) + soma das notas manuais (S, T, U)
    sh.getRange(lastRow, 22).setFormula(
      `=IF(COUNTA(S${lastRow}:U${lastRow})=3, R${lastRow}+SUM(S${lastRow}:U${lastRow}), "Aguardando dissertativas")`
    );

    formatResponseSheet_(sh);
    sh.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('top');

    return {
      ok: true,
      message: `Atividade registrada com sucesso na aba "${targetSheetName}"! Sua nota objetiva foi salva (${objectiveScore}/7); as dissertativas serão corrigidas pelo professor.`
    };
  } finally {
    lock.releaseLock();
  }
}

// ========== CRIAÇÃO E CONFIGURAÇÃO DA ABA DA TURMA ==========
function getOrCreateClassSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }

  const headers = [
    'Data/hora', 'Data', 'Nome', 'Turma', 'RA', 'E-mail institucional', 'Nº chamada',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7',
    'Q8 – dissertativa', 'Q9 – dissertativa', 'Q10 – dissertativa',
    'Nota objetivas', 'Nota Q8 manual', 'Nota Q9 manual', 'Nota Q10 manual', 'Nota final',
    'Status da correção', 'Observação Q8', 'Observação Q9', 'Observação Q10'
  ];

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sh.setFrozenRows(1);
  return sh;
}

// ========== FORMATAÇÃO DAS ABAS DE TURMA ==========
function formatResponseSheet_(sh) {
  const lastCol = 26;
  const lastRow = Math.max(sh.getLastRow(), 2);
  const bodyRows = Math.max(1, lastRow - 1);

  // Cabeçalho
  sh.getRange(1, 1, 1, lastCol)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#14324a')
    .setWrap(true);

  // Corpo das respostas
  sh.getRange(2, 1, bodyRows, lastCol).setWrap(true);

  // Colunas de notas (R a V) com destaque amarelo suave
  sh.getRange(2, 18, bodyRows, 5).setNumberFormat('0.0').setBackground('#fff4cc');

  // Validação para as notas manuais (S, T, U): número entre 0 e 1
  sh.getRange(2, 19, bodyRows, 3).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1).setAllowInvalid(false).build()
  );

  // Formatação condicional para respostas objetivas (Q1 a Q7: Colunas H a N)
  // Regra 1: Acerto -> Azul (#9ccaf7) com texto azul-escuro (#073b73)
  // Regra 2: Erro (qualquer outra célula preenchida) -> Vermelho (#f4aaaa) com texto vermelho-escuro (#8b1e1e)
  // Utiliza métodos nativos do Google Sheets, 100% imunes a problemas de idioma ou fórmulas
  const rules = [];
  const totalRows = Math.max(sh.getMaxRows(), 100);

  Object.keys(ANSWER_KEY).forEach((q, i) => {
    const col = 8 + i; // Coluna H = 8 (Q1)
    const range = sh.getRange(2, col, totalRows - 1, 1);
    const correctAns = ANSWER_KEY[q];

    // Regra 1: Alternativa correta (AZUL)
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(correctAns)
      .setBackground('#9ccaf7')
      .setFontColor('#073b73')
      .setBold(true)
      .setRanges([range])
      .build());

    // Regra 2: Célula preenchida (se não foi capturada pela regra 1, é erro -> VERMELHO)
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenCellNotEmpty()
      .setBackground('#f4aaaa')
      .setFontColor('#8b1e1e')
      .setBold(true)
      .setRanges([range])
      .build());
  });

  sh.setConditionalFormatRules(rules);
  sh.autoResizeColumns(1, lastCol);
  sh.setColumnWidths(15, 3, 260); // Largura confortável para respostas dissertativas
  sh.setColumnWidths(24, 3, 260); // Largura para observações do professor
}

// ========== RESOLVER NOME DA TURMA ("9º Ano A", "9º Ano B") ==========
function resolveClassName_(rawTurma) {
  const norm = normalizeText_(rawTurma);
  if (norm.includes('9') && (norm.includes('ano a') || norm.endsWith(' a') || norm === '9a')) {
    return '9º Ano A';
  }
  if (norm.includes('9') && (norm.includes('ano b') || norm.endsWith(' b') || norm === '9b')) {
    return '9º Ano B';
  }
  return rawTurma || '9º Ano A';
}

function normalizeText_(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function columnLetter_(column) {
  let output = '';
  while (column > 0) {
    const remainder = (column - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    column = Math.floor((column - 1) / 26);
  }
  return output;
}

// ========== PREPARAR ABAS PELO MENU ==========
function setupActivity() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  CLASS_SHEETS.forEach(name => formatResponseSheet_(getOrCreateClassSheet_(ss, name)));
  return 'Abas "9º Ano A" e "9º Ano B" configuradas e formatadas com sucesso!';
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Atividade 9º Ano')
    .addItem('🔧 Preparar abas das turmas', 'setupActivity')
    .addToUi();
}
