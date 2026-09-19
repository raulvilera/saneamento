/**
 * ATIVIDADE DE CIÊNCIAS – 9º ANO
 * - 7 questões objetivas com correção automática por gabarito (0 a 7 pontos).
 * - 3 questões dissertativas corrigidas por Agente de IA (Gemini 3.5 Flash Lite) (0 a 1 ponto cada).
 * - Nota final calculada de 0 a 10 pontos (sem erros de fórmula).
 * - Formatação condicional nativa (Azul para acerto, Vermelho para erro).
 * - Respostas gravadas nas abas das respectivas turmas ("9º Ano A", "9º Ano B").
 */

const SPREADSHEET_ID = '1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU';
const STUDENT_SHEET = 'Alunos';
const CLASS_SHEETS = ['9º Ano A', '9º Ano B'];
const ANSWER_KEY = { q1: 'B', q2: 'B', q3: 'A', q4: 'B', q5: 'B', q6: 'A', q7: 'A' };
const GEMINI_API_KEY = 'AIzaSyDr_WRG1qscvcz6zZtN9ohCH-_YCtfUV4o';

// ========== REQUISIÇÕES GET ==========
function doGet(e) {
  const params = (e && e.parameter) || {};

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

  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'API Atividade 9º Ano com Corretor de IA ativa.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========== REQUISIÇÕES POST ==========
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

// ========== SALVAR RESPOSTAS NA ABA DA TURMA ==========
function saveResponse(payload) {
  if (!payload || !payload.nome || !payload.turma) {
    throw new Error('Nome e turma são obrigatórios.');
  }

  const targetSheetName = resolveClassName_(payload.turma);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = getOrCreateClassSheet_(ss, targetSheetName);

    const answers = payload.answers || {};

    // 1. Correção das questões objetivas (0 a 7)
    const objectiveScore = Object.keys(ANSWER_KEY).reduce((sum, q) => {
      const userAns = String(answers[q] || '').trim().toUpperCase();
      return userAns === ANSWER_KEY[q] ? sum + 1 : sum;
    }, 0);

    // 2. Tenta corrigir dissertativas com Agente de IA imediatamente
    let notaQ8 = '';
    let notaQ9 = '';
    let notaQ10 = '';
    let obsQ8 = '';
    let obsQ9 = '';
    let obsQ10 = '';
    let statusCorrecao = 'Aguardando correção manual';
    let notaFinal = objectiveScore; // Provisória até dissertativas

    try {
      const graded = gradeDissertativeWithAI_(answers.q8, answers.q9, answers.q10);
      if (graded && graded.q8 !== undefined) {
        notaQ8 = graded.q8.nota;
        notaQ9 = graded.q9.nota;
        notaQ10 = graded.q10.nota;
        obsQ8 = graded.q8.obs;
        obsQ9 = graded.q9.obs;
        obsQ10 = graded.q10.obs;
        statusCorrecao = 'Corrigido por IA';
        notaFinal = Math.round((objectiveScore + notaQ8 + notaQ9 + notaQ10) * 10) / 10;
      }
    } catch (e) {
      Logger.log('Aviso: IA em espera para autorização: ' + e.message);
    }

    const now = new Date();
    const dataFormatada = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');

    const row = [
      now,                                           // Col A: Data/hora
      dataFormatada,                                 // Col B: Data
      String(payload.nome || '').trim(),             // Col C: Nome
      targetSheetName,                               // Col D: Turma
      String(payload.ra || '').trim(),               // Col E: RA
      String(payload.email || '').trim(),            // Col F: E-mail
      String(payload.chamada || '').trim(),          // Col G: Nº chamada
      String(answers.q1 || '').trim().toUpperCase(), // Col H: Q1
      String(answers.q2 || '').trim().toUpperCase(), // Col I: Q2
      String(answers.q3 || '').trim().toUpperCase(), // Col J: Q3
      String(answers.q4 || '').trim().toUpperCase(), // Col K: Q4
      String(answers.q5 || '').trim().toUpperCase(), // Col L: Q5
      String(answers.q6 || '').trim().toUpperCase(), // Col M: Q6
      String(answers.q7 || '').trim().toUpperCase(), // Col N: Q7
      answers.q8 || '',                              // Col O: Q8 dissertativa
      answers.q9 || '',                              // Col P: Q9 dissertativa
      answers.q10 || '',                             // Col Q: Q10 dissertativa
      objectiveScore,                                // Col R: Nota objetivas (0-7)
      notaQ8,                                        // Col S: Nota Q8 (IA)
      notaQ9,                                        // Col T: Nota Q9 (IA)
      notaQ10,                                       // Col U: Nota Q10 (IA)
      notaFinal,                                     // Col V: Nota final (sem fórmulas com erro)
      statusCorrecao,                                // Col W: Status da correção
      obsQ8,                                         // Col X: Obs Q8
      obsQ9,                                         // Col Y: Obs Q9
      obsQ10                                         // Col Z: Obs Q10
    ];

    sh.appendRow(row);
    const lastRow = sh.getLastRow();

    formatResponseSheet_(sh);
    sh.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('top');

    const msgStatus = statusCorrecao === 'Corrigido por IA'
      ? `Suas respostas foram corrigidas com sucesso! Nota final: ${notaFinal}/10.`
      : `Sua nota nas objetivas foi salva (${objectiveScore}/7); as dissertativas serão corrigidas pelo professor.`;

    return {
      ok: true,
      message: `Atividade registrada na aba "${targetSheetName}". ${msgStatus}`
    };
  } finally {
    lock.releaseLock();
  }
}

// ========== AGENTE DE IA: CORRETOR DE DISSERTATIVAS (GEMINI) ==========
function gradeDissertativeWithAI_(q8Text, q9Text, q10Text) {
  if (!GEMINI_API_KEY) {
    Logger.log('GEMINI_API_KEY não configurada.');
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  const cleanQ8 = String(q8Text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'");
  const cleanQ9 = String(q9Text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'");
  const cleanQ10 = String(q10Text || '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'");

  const prompt = `Você é um professor especialista avaliador de Ciências do 9º ano.
Avalie pedagogicamente as 3 respostas dissertativas dos alunos com uma nota de 0.0 a 1.0 e um feedback curto (máximo 15 palavras) para cada uma.

CRITÉRIOS DE CORREÇÃO:
- Questão 8 (Pegada ecológica - 1,0 ponto): Explicar como consumo de descartáveis, viagens de avião e desperdício de alimentos aumentam a pegada ecológica (0,5 pt) e indicar uma mudança de hábito para reduzi-la (0,5 pt).
- Questão 9 (Economia circular - 1,0 ponto): Explicar por que trocar a bateria do celular e reaproveitar peças representa economia circular (extensão de vida útil, reparo/reutilização e redução de resíduos/lixo eletrônico) (1,0 pt). Se apenas citou conserto sem fundamentar = 0,5 pt.
- Questão 10 (Resíduos e reciclagem - 1,0 ponto): Explicar como a coleta seletiva reduz impactos dos lixões (0,5 pt) e citar dois benefícios ambientais reais (0,5 pt).

RESPOSTAS DO ALUNO:
- Q8: "${cleanQ8}"
- Q9: "${cleanQ9}"
- Q10: "${cleanQ10}"

Responda ESTRITAMENTE em formato JSON:
{
  "q8": { "nota": 1.0, "obs": "Feedback em até 15 palavras." },
  "q9": { "nota": 1.0, "obs": "Feedback em até 15 palavras." },
  "q10": { "nota": 1.0, "obs": "Feedback em até 15 palavras." }
}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    Logger.log('Erro na chamada Gemini: ' + response.getContentText());
    return null;
  }

  const json = JSON.parse(response.getContentText());
  const rawText = json.candidates[0].content.parts[0].text;
  const result = JSON.parse(rawText);

  return {
    q8: {
      nota: Math.min(1.0, Math.max(0.0, Number(result.q8?.nota || 0))),
      obs: String(result.q8?.obs || '').trim()
    },
    q9: {
      nota: Math.min(1.0, Math.max(0.0, Number(result.q9?.nota || 0))),
      obs: String(result.q9?.obs || '').trim()
    },
    q10: {
      nota: Math.min(1.0, Math.max(0.0, Number(result.q10?.nota || 0))),
      obs: String(result.q10?.obs || '').trim()
    }
  };
}

// ========== FUNÇÃO PRINCIPAL: CORRIGIR TODAS AS PENDENTES COM IA ==========
function CORRIGIR_DISSERTATIVAS_AGORA() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let totalCorrigidos = 0;

  CLASS_SHEETS.forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 2) return;

    const lastRow = sh.getLastRow();
    const data = sh.getRange(2, 1, lastRow - 1, 26).getValues();

    for (let i = 0; i < data.length; i++) {
      const rowIndex = i + 2;
      const status = String(data[i][22] || ''); // Coluna W: Status da correção
      const notaQ8Atual = data[i][18];          // Coluna S

      // Se a linha ainda não tem nota nas dissertativas ou está aguardando
      if (status.toLowerCase().includes('aguardando') || notaQ8Atual === '' || notaQ8Atual === null) {
        const q8 = data[i][14]; // Coluna O
        const q9 = data[i][15]; // Coluna P
        const q10 = data[i][16]; // Coluna Q
        const notaObj = Number(data[i][17] || 0); // Coluna R

        try {
          const graded = gradeDissertativeWithAI_(q8, q9, q10);
          if (graded) {
            const notaFinal = Math.round((notaObj + graded.q8.nota + graded.q9.nota + graded.q10.nota) * 10) / 10;

            sh.getRange(rowIndex, 19).setValue(graded.q8.nota);  // Col S: Nota Q8
            sh.getRange(rowIndex, 20).setValue(graded.q9.nota);  // Col T: Nota Q9
            sh.getRange(rowIndex, 21).setValue(graded.q10.nota); // Col U: Nota Q10
            sh.getRange(rowIndex, 22).setValue(notaFinal);       // Col V: Nota final sem erro
            sh.getRange(rowIndex, 23).setValue('Corrigido por IA'); // Col W: Status
            sh.getRange(rowIndex, 24).setValue(graded.q8.obs);   // Col X: Obs Q8
            sh.getRange(rowIndex, 25).setValue(graded.q9.obs);   // Col Y: Obs Q9
            sh.getRange(rowIndex, 26).setValue(graded.q10.obs);  // Col Z: Obs Q10
            totalCorrigidos++;
          }
        } catch (err) {
          Logger.log(`Erro ao corrigir linha ${rowIndex} na aba ${sheetName}: ${err.message}`);
        }
      }
    }
  });

  const msg = `${totalCorrigidos} atividade(s) corrigida(s) com sucesso pela IA!`;
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Correção Concluída', 5);
  return msg;
}

// ========== CONFIGURAÇÃO DA ABA DA TURMA ==========
function getOrCreateClassSheet_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }

  const headers = [
    'Data/hora', 'Data', 'Nome', 'Turma', 'RA', 'E-mail institucional', 'Nº chamada',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7',
    'Q8 – dissertativa', 'Q9 – dissertativa', 'Q10 – dissertativa',
    'Nota objetivas', 'Nota Q8 (IA)', 'Nota Q9 (IA)', 'Nota Q10 (IA)', 'Nota final',
    'Status da correção', 'Observação Q8', 'Observação Q9', 'Observação Q10'
  ];

  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sh.setFrozenRows(1);
  return sh;
}

// ========== FORMATAÇÃO DAS CORES (AZUL E VERMELHO NATIVOS) ==========
function formatResponseSheet_(sh) {
  const lastCol = 26;
  const totalRows = Math.max(sh.getMaxRows(), 100);

  // Cabeçalho azul escuro
  sh.getRange(1, 1, 1, lastCol)
    .setFontWeight('bold')
    .setFontColor('#ffffff')
    .setBackground('#14324a')
    .setWrap(true);

  sh.getRange(2, 1, totalRows - 1, lastCol).setWrap(true);

  // Destaque para as notas
  sh.getRange(2, 18, totalRows - 1, 5).setNumberFormat('0.0').setBackground('#fff4cc');

  // Validação das notas dissertativas (0 a 1)
  sh.getRange(2, 19, totalRows - 1, 3).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1).setAllowInvalid(false).build()
  );

  // Formatação condicional: Azul para acerto, Vermelho para erro
  const rules = [];

  Object.keys(ANSWER_KEY).forEach((q, i) => {
    const col = 8 + i; // Coluna H = 8
    const range = sh.getRange(2, col, totalRows - 1, 1);
    const correctLetter = ANSWER_KEY[q];

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(correctLetter)
        .setBackground('#9ccaf7')
        .setFontColor('#073b73')
        .setBold(true)
        .setRanges([range])
        .build()
    );

    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenCellNotEmpty()
        .setBackground('#f4aaaa')
        .setFontColor('#8b1e1e')
        .setBold(true)
        .setRanges([range])
        .build()
    );
  });

  sh.setConditionalFormatRules(rules);
  sh.autoResizeColumns(1, lastCol);
  sh.setColumnWidths(15, 3, 260);
  sh.setColumnWidths(24, 3, 260);
}

// ========== FUNÇÕES AUXILIARES ==========
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

// ========== ATUALIZAR CORES E CABEÇALHOS ==========
function setupActivity() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  CLASS_SHEETS.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) formatResponseSheet_(sh);
  });
  return 'Cores azul e vermelho aplicadas com sucesso!';
}

// ========== MENU NA PLANILHA ==========
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Atividade 9º Ano')
    .addItem('🤖 Corrigir dissertativas com IA', 'CORRIGIR_DISSERTATIVAS_AGORA')
    .addItem('🎨 Atualizar cores (Azul / Vermelho)', 'setupActivity')
    .addToUi();
}
