# Atividade de Ciências – 9º ano

Esta pasta contém uma atividade interativa para o **3º bimestre**, baseada nos temas identificados no arquivo de revisão anexado: evolução, especiação, estruturas homólogas e análogas, fósseis, Unidades de Conservação, qualidade da água, Agenda 2030, pegada ecológica, economia circular e reciclagem.

## Arquivos

| Arquivo | Função |
|---|---|
| `Index.html` | Interface completa da atividade, com CSS, JavaScript, imagens extraídas do anexo, listas dependentes de turma/nome e envio das respostas. |
| `Code.gs` | Backend Apps Script: publicação, leitura da aba `Alunos`, registro na aba `Respostas` e formação condicional. |

## Integração com o Apps Script

O `index.html` está configurado para o deployment informado:

`https://script.google.com/macros/s/AKfycbx3R9FXt9bU9TWcjpp_YofB6Wi7jnU-ShF4U8ZiNbghgwLdf4yedt-lxP7h9XSTSu9K/exec`

O frontend usa `GET?action=students&callback=...` para carregar os alunos e `POST` com o objeto JSON da atividade para registrar as respostas. Isso corresponde aos métodos `doGet(e)` e `doPost(e)` do código Apps Script anexado.

## Como instalar

1. Abra a planilha indicada pelo professor: <https://docs.google.com/spreadsheets/d/1lSBx2P0e8YIHOfUVzbNgTu7y0QGFdl1N9gunK5P3liU/edit>.
2. Abra **Extensões → Apps Script**.
3. Crie um arquivo HTML chamado `Index` e cole o conteúdo de `Index.html`.
4. No arquivo `Code.gs`, cole o conteúdo de `Code.gs`.
5. Execute uma vez a função `setupActivity` e autorize o script. Essa função cria/prepara as abas `Alunos` e `Respostas`.
6. Na aba `Alunos`, mantenha exatamente estes cabeçalhos na primeira linha: `Turma | Nome | RA`. A partir da segunda linha, cadastre os estudantes, por exemplo:

   | Turma | Nome | RA |
   |---|---|---|
   | 9º Ano A | Ana Souza | 123456789 |
   | 9º Ano B | João Lima | 987654321 |

7. No Apps Script, selecione **Implantar → Nova implantação → Aplicativo da web**. Escolha executar como **Eu** e permitir acesso conforme a política da escola. Copie a URL gerada para os alunos.

## Funcionamento da correção

As questões 1 a 7 são objetivas e têm gabarito automático: **Q1-B, Q2-B, Q3-A, Q4-B, Q5-B, Q6-A e Q7-A**. Na aba `Respostas`, as respostas objetivas corretas ficam com preenchimento **azul** e as incorretas com preenchimento **vermelho**. As questões 8 a 10 são dissertativas e ficam com preenchimento **amarelo** para correção manual.

As imagens originais do arquivo fornecido foram extraídas e incorporadas diretamente no HTML: a imagem de asas de inseto/ave está na questão 2; a comparação anatômica de vertebrados, na questão 3; o fóssil, na questão 4; a tabela de qualidade da água, na questão 6; o ciclo da economia circular, na questão 9; e a fotografia do lixão, na questão 10. Dessa forma, essas seis imagens não dependem de carregamento externo.

O envio registra data/hora, nome, turma, RA, respostas, nota objetiva e status das dissertativas. O nome só aparece depois que a turma é selecionada, e o RA é carregado automaticamente a partir da aba `Alunos`.

## Observações pedagógicas

A atividade possui **10 questões**, sendo **7 de múltipla escolha e 3 dissertativas**, com enunciados contextualizados. As imagens são fotografias ilustrativas carregadas por URLs do Unsplash e estão posicionadas entre os enunciados e as alternativas ou campos de resposta. As alternativas apresentam efeito de alto relevo; ao serem selecionadas, afundam e ficam verde-escuro, com texto branco em negrito.

As respostas dissertativas não são avaliadas automaticamente, pois exigem critérios pedagógicos do professor. O campo amarelo sinaliza essa necessidade.
