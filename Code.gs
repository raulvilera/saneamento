/**
 * ATIVIDADE DE CIÊNCIAS – 9º ANO
 * - 7 questões objetivas com correção automática por gabarito (0 a 7 pontos).
 * - 3 questões dissertativas corrigidas por Agente de IA (Gemini) (0 a 1 ponto cada).
 * - Nota final calculada automaticamente de 0 a 10 pontos.
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

    // 2. Correção das questões dissertativas pelo Agente de IA (Gemini)
    let aiGrades = {
      q8: { nota: '', obs: '' },
      q9: { nota: '', obs: '' },
      q10: { nota: '', obs: '' },
      status: 'Aguardando correção manual'
    };

    try {
      const graded = gradeDissertativeWithAI_(answers.q8, answers.q9, answers.q10);
      if (graded) {
        aiGrades = {
          q8: graded.q8,
          q9: graded.q9,
          q10: graded.q10,
          status: 'Corrigido por IA'
        };
      }
    } catch (e) {
      Logger.log('Aviso: Falha temporária na IA durante envio. Ficará pendente para correção posterior: ' + e.message);
    }

    const now = new Date();
    const dataFormatada = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');

    const row = [
      now,                                     // Col A: Data/hora
      dataFormatada,                           // Col B: Data
      String(payload.nome || '').trim(),       // Col C: Nome
      targetSheetName,                         // Col D: Turma
      String(payload.ra || '').trim(),         // Col E: RA
      String(payload.email || '').trim(),      // Col F: E-mail
      String(payload.chamada || '').trim(),    // Col G: Nº chamada
      String(answers.q1 || '').trim().toUpperCase(), // Col H: Q1
      String(answers.q2 || '').trim().toUpperCase(), // Col I: Q2
      String(answers.q3 || '').trim().toUpperCase(), // Col J: Q3
      String(answers.q4 || '').trim().toUpperCase(), // Col K: Q4
      String(answers.q5 || '').trim().toUpperCase(), // Col L: Q5
      String(answers.q6 || '').trim().toUpperCase(), // Col M: Q6
      String(answers.q7 || '').trim().toUpperCase(), // Col N: Q7
      answers.q8 || '',                        // Col O: Q8 dissertativa
      answers.q9 || '',                        // Col P: Q9 dissertativa
      answers.q10 || '',                       // Col Q: Q10 dissertativa
      objectiveScore,                          // Col R: Nota objetivas (0-7)
      aiGrades.q8.nota,                        // Col S: Nota Q8 (0.0 a 1.0)
      aiGrades.q9.nota,                        // Col T: Nota Q9 (0.0 a 1.0)
      aiGrades.q10.nota,                       // Col U: Nota Q10 (0.0 a 1.0)
      '',                                      // Col V: Nota final (calculada via fórmula)
      aiGrades.status,                         // Col W: Status da correção
      aiGrades.q8.obs,                         // Col X: Observação Q8
      aiGrades.q9.obs,                         // Col Y: Observação Q9
      aiGrades.q10.obs                         // Col Z: Observação Q10
    ];

    sh.appendRow(row);
    const lastRow = sh.getLastRow();

    // Fórmula para nota final: Nota objetiva (R) + soma das notas dissertativas (S, T, U)
    sh.getRange(lastRow, 22).setFormula(
      `=IF(COUNT(S${lastRow}:U${lastRow})=3, R${lastRow}+SUM(S${lastRow}:U${lastRow}), "Aguardando dissertativas")`
    );

    formatResponseSheet_(sh);
    sh.getRange(lastRow, 1, 1, row.length).setVerticalAlignment('top');

    const msgStatus = aiGrades.status === 'Corrigido por IA'
      ? 'Suas respostas objetivas e dissertativas foram corrigidas e pontuadas com sucesso!'
      : 'Sua nota objetiva foi salva (' + objectiveScore + '/7); as dissertativas serão corrigidas em seguida.';

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

  const prompt = `Você é um professor especialista avaliador de Ciências do 9º ano do Ensino Fundamental.
Avalie com rigor pedagógico e justiça as 3 respostas dissertativas a seguir.

RUBRICA PEDAGÓGICA DE AVALIAÇÃO:
1. Questão 8 – Pegada ecológica (Valor: 1,0 ponto):
   - Enunciado: Família passou a consumir mais descartáveis, viajar frequentemente de avião e desperdiçar comida. Explicar como essas escolhas aumentam a pegada ecológica e indicar uma mudança de hábito para reduzi-la.
   - Critérios: 0,5 ponto por explicar a relação com emissão de carbono/poluição/consumo excessivo de recursos e 0,5 ponto por indicar uma mudança de hábito plausível e efetiva. Se deixou em branco ou fugiu do tema = 0.0.

2. Questão 9 – Economia circular (Valor: 1,0 ponto):
   - Enunciado: Celular com defeito teve a bateria trocada em vez de ser descartado, continuou em uso e as peças restantes foram encaminhadas para reaproveitamento. Explicar por que representa a economia circular.
   - Critérios: 1,0 ponto por identificar a extensão do ciclo de vida, reparo/reutilização e diminuição de resíduos/lixo eletrônico. Se citou apenas conserto sem fundamentar = 0,5. Em branco = 0.0.

3. Questão 10 – Resíduos e reciclagem (Valor: 1,0 ponto):
   - Enunciado: Moradores separam papel, plástico, vidro e metal para coleta seletiva. Explicar como reduz impactos dos lixões e citar dois benefícios ambientais.
   - Critérios: 0,5 ponto por explicar a redução do volume de resíduos nos lixões/contaminação e 0,5 ponto por citar dois benefícios ambientais corretos (ex: economia de recursos, menos poluição, economia de energia). Apenas um benefício = 0,25. Em branco = 0.0.

RESPOSTAS DO ALUNO:
- Resposta Q8: "${String(q8Text || '').replace(/"/g, "'")}"
- Resposta Q9: "${String(q9Text || '').replace(/"/g, "'")}"
- Resposta Q10: "${String(q10Text || '').replace(/"/g, "'")}"

INSTRUÇÕES DE SAÍDA:
Retorne ESTRITAMENTE um objeto JSON válido, sem crases de markdown extras, no formato:
{
  "q8": { "nota": 1.0, "obs": "Feedback de até 15 palavras justificando a nota." },
  "q9": { "nota": 1.0, "obs": "Feedback de até 15 palavras justificando a nota." },
  "q10": { "nota": 1.0, "obs": "Feedback de até 15 palavras justificando a nota." }
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

// ========== CORREÇÃO EM LOTE PELO MENU (CORRIGIR TODAS AS PENDENTES) ==========
function gradeAllPendingWithAI() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let totalCorrigidos = 0;

  CLASS_SHEETS.forEach(sheetName => {
    const sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 2) return;

    const data = sh.getRange(2, 1, sh.getLastRow() - 1, 26).getValues();

    for (let i = 0; i < data.length; i++) {
      const rowIndex = i + 2;
      const status = String(data[i][22] || ''); // Coluna W: Status da correção

      // Se a linha estiver aguardando correção ou sem nota nas dissertativas
      if (status.toLowerCase().includes('aguardando') || !data[i][18]) {
        const q8 = data[i][14]; // Coluna O
        const q9 = data[i][15]; // Coluna P
        const q10 = data[i][16]; // Coluna Q

        try {
          const graded = gradeDissertativeWithAI_(q8, q9, q10);
          if (graded) {
            sh.getRange(rowIndex, 19).setValue(graded.q8.nota);  // Col S: Nota Q8
            sh.getRange(rowIndex, 20).setValue(graded.q9.nota);  // Col T: Nota Q9
            sh.getRange(rowIndex, 21).setValue(graded.q10.nota); // Col U: Nota Q10
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

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `${totalCorrigidos} atividade(s) corrigida(s) pela IA com sucesso!`,
    'Correção Concluída',
    5
  );

  return `${totalCorrigidos} atividades corrigidas com sucesso pela IA!`;
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

  // FORMATAÇÃO CONDICIONAL NATIVA (Q1 a Q7 - Colunas H a N)
  const rules = [];

  Object.keys(ANSWER_KEY).forEach((q, i) => {
    const col = 8 + i; // Coluna H = 8
    const range = sh.getRange(2, col, totalRows - 1, 1);
    const correctLetter = ANSWER_KEY[q];

    // Regra 1: Acerto -> AZUL CLARO (#9ccaf7) com texto azul escuro
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(correctLetter)
        .setBackground('#9ccaf7')
        .setFontColor('#073b73')
        .setBold(true)
        .setRanges([range])
        .build()
    );

    // Regra 2: Erro -> Célula preenchida que não seja o acerto -> VERMELHO CLARO (#f4aaaa) com texto vermelho escuro
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
  sh.setColumnWidths(15, 3, 260); // Dissertativas
  sh.setColumnWidths(24, 3, 260); // Observações
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

function columnLetter_(column) {
  let output = '';
  while (column > 0) {
    const remainder = (column - 1) % 26;
    output = String.fromCharCode(65 + remainder) + output;
    column = Math.floor((column - 1) / 26);
  }
  return output;
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
    .addItem('🤖 Corrigir dissertativas com IA', 'gradeAllPendingWithAI')
    .addItem('🎨 Atualizar cores (Azul / Vermelho)', 'setupActivity')
    .addToUi();
}
