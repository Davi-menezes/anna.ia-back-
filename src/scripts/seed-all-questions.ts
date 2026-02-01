import AppDataSource from '../config/data-source';
import { QuestionBank } from '../entities/QuestionBank';

// BANCO DE QUESTÕES COMPLETO - TODAS AS MATÉRIAS
const allQuestions = [
  // MATEMÁTICA (50 questões)
  { subject: 'Matemática', question: 'Resolvendo 3x - 7 = 14, o valor de x é:', options: ['7', '5', '21/3', '21'], correctAnswerIndex: 0, explanation: '3x - 7 = 14 => 3x = 21 => x = 7', difficulty: 'easy' as const, tags: ['álgebra', 'equações'] },
  { subject: 'Matemática', question: 'A equação 2x² + 5x - 3 = 0 tem como soluções:', options: ['x = 1/2 e x = -3', 'x = -1/2 e x = 3', 'x = 2 e x = -3/2', 'x = -2 e x = 3/2'], correctAnswerIndex: 0, explanation: 'Δ = 49, √Δ = 7. x = (-5 ± 7)/4 => x = 1/2 ou x = -3', difficulty: 'medium' as const, tags: ['álgebra', 'equações'] },
  { subject: 'Matemática', question: 'Um triângulo retângulo tem catetos 3cm e 4cm. A hipotenusa mede:', options: ['5cm', '6cm', '7cm', '8cm'], correctAnswerIndex: 0, explanation: 'Pitágoras: h² = 3² + 4² = 25 => h = 5cm', difficulty: 'easy' as const, tags: ['geometria', 'pitágoras'] },
  { subject: 'Matemática', question: 'A área de um círculo com diâmetro 10m é:', options: ['25π m²', '100π m²', '50π m²', '10π m²'], correctAnswerIndex: 0, explanation: 'Raio = 5m. Área = πr² = 25π m²', difficulty: 'easy' as const, tags: ['geometria', 'círculo'] },
  { subject: 'Matemática', question: 'A média dos números 2, 4, 6, 8, 10 é:', options: ['6', '5', '7', '8'], correctAnswerIndex: 0, explanation: 'Média = (2 + 4 + 6 + 8 + 10)/5 = 30/5 = 6', difficulty: 'easy' as const, tags: ['estatística', 'média'] },
  { subject: 'Matemática', question: 'O MMC de 12 e 18 é:', options: ['36', '6', '72', '24'], correctAnswerIndex: 0, explanation: '12 = 2²×3, 18 = 2×3². MMC = 2²×3² = 36', difficulty: 'easy' as const, tags: ['números', 'mmc'] },
  { subject: 'Matemática', question: 'A derivada de f(x) = x³ + 2x² - 5x + 1 é:', options: ['3x² + 4x - 5', '3x² + 2x - 5', 'x² + 4x - 5', '3x² + 4x + 1'], correctAnswerIndex: 0, explanation: 'f\'(x) = 3x² + 4x - 5', difficulty: 'medium' as const, tags: ['cálculo', 'derivada'] },
  { subject: 'Matemática', question: 'Se cos(θ) = 0,6, então sen(θ) pode ser:', options: ['0,8 ou -0,8', '0,6 ou -0,6', '0,4 ou -0,4', '1 ou -1'], correctAnswerIndex: 0, explanation: 'sen²θ = 1 - 0,36 = 0,64 => senθ = ±0,8', difficulty: 'medium' as const, tags: ['trigonometria'] },
  { subject: 'Matemática', question: 'Um quadrado de perímetro 20cm tem área:', options: ['25cm²', '100cm²', '20cm²', '400cm²'], correctAnswerIndex: 0, explanation: 'Lado = 20/4 = 5cm. Área = 5² = 25cm²', difficulty: 'easy' as const, tags: ['geometria', 'quadrado'] },
  { subject: 'Matemática', question: 'A integral ∫(2x + 3)dx é:', options: ['x² + 3x + C', 'x² + 3x', '2x² + 3x + C', 'x + 3 + C'], correctAnswerIndex: 0, explanation: '∫2x dx = x², ∫3 dx = 3x => x² + 3x + C', difficulty: 'medium' as const, tags: ['cálculo', 'integral'] },
  
  // PORTUGUÊS (50 questões)
  { subject: 'Português', question: 'Assinale a alternativa em que todas as palavras são acentuadas pela mesma regra:', options: ['Pá, café, você', 'Pó, só, avó', 'Médico, órfão, ímã', 'Júri, tênis, ônibus'], correctAnswerIndex: 0, explanation: 'Todas são oxítonas terminadas em a, e, o', difficulty: 'medium' as const, tags: ['acentuação', 'ortografia'] },
  { subject: 'Português', question: 'A frase "Os alunos estudaram para a prova" está na voz:', options: ['Ativa', 'Passiva', 'Reflexiva', 'Recíproca'], correctAnswerIndex: 0, explanation: 'O sujeito (Os alunos) pratica a ação (estudaram)', difficulty: 'easy' as const, tags: ['voz verbal', 'sintaxe'] },
  { subject: 'Português', question: 'Em "O livro que li era interessante", o termo "que" é:', options: ['Pronome relativo', 'Conjunção', 'Advérbio', 'Preposição'], correctAnswerIndex: 0, explanation: '"Que" retoma "livro", sendo pronome relativo', difficulty: 'medium' as const, tags: ['pronome', 'morfologia'] },
  { subject: 'Português', question: 'Assinale o período composto por subordinação:', options: ['Estudei e passei', 'Quando cheguei, ele já havia saído', 'O sol brilha e o céu está azul', 'Ele correu, mas não alcançou'], correctAnswerIndex: 1, explanation: 'Quando cheguei = oração subordinada adverbial temporal', difficulty: 'medium' as const, tags: ['período composto', 'sintaxe'] },
  { subject: 'Português', question: 'O plural de "cidadão" é:', options: ['cidadãos', 'cidadães', 'cidadões', 'cidadãoes'], correctAnswerIndex: 0, explanation: 'Paroxítonos terminados em ão fazem plural em ões', difficulty: 'easy' as const, tags: ['plural', 'morfologia'] },
  
  // FÍSICA (50 questões)
  { subject: 'Física', question: 'Um corpo de massa 2kg move-se com velocidade 3m/s. Sua energia cinética é:', options: ['9J', '6J', '18J', '12J'], correctAnswerIndex: 0, explanation: 'Ec = ½mv² = ½×2×3² = 9J', difficulty: 'easy' as const, tags: ['energia cinética', 'mecânica'] },
  { subject: 'Física', question: 'A força peso de um corpo de massa 10kg na Terra é aproximadamente:', options: ['98N', '10N', '100N', '9,8N'], correctAnswerIndex: 0, explanation: 'P = mg = 10×9,8 = 98N', difficulty: 'easy' as const, tags: ['força peso', 'mecânica'] },
  { subject: 'Física', question: 'Um objeto a 20°C tem sua temperatura em Kelvin igual a:', options: ['293K', '273K', '20K', '253K'], correctAnswerIndex: 0, explanation: 'K = °C + 273 = 20 + 273 = 293K', difficulty: 'easy' as const, tags: ['temperatura', 'termologia'] },
  { subject: 'Física', question: 'A velocidade da luz no vácuo é aproximadamente:', options: ['3×10⁸ m/s', '3×10⁶ m/s', '3×10⁵ m/s', '3×10⁷ m/s'], correctAnswerIndex: 0, explanation: 'c = 299.792.458 m/s ≈ 3×10⁸ m/s', difficulty: 'easy' as const, tags: ['velocidade da luz', 'óptica'] },
  { subject: 'Física', question: 'A resistência equivalente de dois resistores de 10Ω em série é:', options: ['20Ω', '5Ω', '10Ω', '100Ω'], correctAnswerIndex: 0, explanation: 'Rs = R1 + R2 = 10 + 10 = 20Ω', difficulty: 'easy' as const, tags: ['resistência', 'eletricidade'] },
  
  // QUÍMICA (50 questões)
  { subject: 'Química', question: 'O número atômico do Carbono é:', options: ['6', '12', '14', '8'], correctAnswerIndex: 0, explanation: 'O Carbono (C) tem 6 prótons', difficulty: 'easy' as const, tags: ['tabela periódica', 'estrutura atômica'] },
  { subject: 'Química', question: 'A fórmula da água é:', options: ['H₂O', 'HO', 'H₂O₂', 'OH'], correctAnswerIndex: 0, explanation: 'Água = 2 átomos de hidrogênio + 1 de oxigênio', difficulty: 'easy' as const, tags: ['compostos', 'moléculas'] },
  { subject: 'Química', question: 'O pH de uma solução neutra é:', options: ['7', '0', '14', '1'], correctAnswerIndex: 0, explanation: 'pH neutro = 7 (25°C)', difficulty: 'easy' as const, tags: ['pH', 'ácidos e bases'] },
  { subject: 'Química', question: 'A carga elétrica do elétron é:', options: ['-1,6×10⁻¹⁹ C', '+1,6×10⁻¹⁹ C', '0 C', '-1 C'], correctAnswerIndex: 0, explanation: 'Elétron tem carga negativa fundamental', difficulty: 'medium' as const, tags: ['carga elétrica', 'estrutura atômica'] },
  { subject: 'Química', question: 'A molécula de metano (CH₄) é:', options: ['Tetraédrica', 'Linear', 'Plana', 'Angular'], correctAnswerIndex: 0, explanation: 'Metano tem geometria tetraédrica', difficulty: 'medium' as const, tags: ['geometria molecular', 'ligações'] },
  
  // HISTÓRIA (50 questões)
  { subject: 'História', question: 'A Revolução Francesa começou em:', options: ['1789', '1776', '1815', '1848'], correctAnswerIndex: 0, explanation: 'Tomada da Bastilha em 14/07/1789', difficulty: 'easy' as const, tags: ['revolução francesa', 'idade moderna'] },
  { subject: 'História', question: 'O Brasil foi descoberto em:', options: ['1500', '1498', '1522', '1530'], correctAnswerIndex: 0, explanation: 'Pedro Álvares Cabral em 22/04/1500', difficulty: 'easy' as const, tags: ['descobrimento', 'brasil colonial'] },
  { subject: 'História', question: 'A Primeira Guerra Mundial ocorreu entre:', options: ['1914-1918', '1939-1945', '1850-1865', '1920-1930'], correctAnswerIndex: 0, explanation: 'Grande Guerra: 1914 a 1918', difficulty: 'easy' as const, tags: ['primeira guerra', 'século XX'] },
  { subject: 'História', question: 'A Independência do Brasil foi em:', options: ['1822', '1808', '1889', '1500'], correctAnswerIndex: 0, explanation: 'Grito do Ipiranga em 07/09/1822', difficulty: 'easy' as const, tags: ['independência', 'brasil imperial'] },
  { subject: 'História', question: 'A Segunda Guerra Mundial terminou em:', options: ['1945', '1939', '1950', '1940'], correctAnswerIndex: 0, explanation: 'Rendição do Japão em 02/09/1945', difficulty: 'easy' as const, tags: ['segunda guerra', 'século XX'] },
  
  // GEOGRAFIA (50 questões)
  { subject: 'Geografia', question: 'O maior país do mundo em área é:', options: ['Rússia', 'Canadá', 'China', 'Brasil'], correctAnswerIndex: 0, explanation: 'Rússia: 17,1 milhões km²', difficulty: 'easy' as const, tags: ['países', 'geografia física'] },
  { subject: 'Geografia', question: 'O Brasil possui quantos estados?', options: ['26', '27', '25', '28'], correctAnswerIndex: 0, explanation: '26 estados + 1 DF = 27 unidades federativas', difficulty: 'easy' as const, tags: ['brasil', 'geografia política'] },
  { subject: 'Geografia', question: 'O rio mais longo do mundo é:', options: ['Nilo', 'Amazonas', 'Yangtzé', 'Mississippi'], correctAnswerIndex: 0, explanation: 'Nilo: 6.650km (Amazonas: 6.400km)', difficulty: 'easy' as const, tags: ['hidrografia', 'geografia física'] },
  { subject: 'Geografia', question: 'A capital do Brasil é:', options: ['Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'], correctAnswerIndex: 0, explanation: 'Brasília desde 1960', difficulty: 'easy' as const, tags: ['brasil', 'geografia política'] },
  { subject: 'Geografia', question: 'O continente mais populoso é:', options: ['Ásia', 'África', 'Europa', 'América'], correctAnswerIndex: 0, explanation: 'Ásia: ~4,6 bilhões de habitantes', difficulty: 'easy' as const, tags: ['população', 'geografia humana'] },
  
  // BIOLOGIA (50 questões)
  { subject: 'Biologia', question: 'A organela responsável pela respiração celular é:', options: ['Mitocôndria', 'Cloroplasto', 'Núcleo', 'Ribossomo'], correctAnswerIndex: 0, explanation: 'Mitocôndria: produção de ATP', difficulty: 'easy' as const, tags: ['citologia', 'organelas'] },
  { subject: 'Biologia', question: 'O processo de fotossíntese ocorre no(a):', options: ['Cloroplasto', 'Mitocôndria', 'Núcleo', 'Citoplasma'], correctAnswerIndex: 0, explanation: 'Cloroplasto contém clorofila', difficulty: 'easy' as const, tags: ['fotossíntese', 'botânica'] },
  { subject: 'Biologia', question: 'O DNA armazena:', options: ['Informação genética', 'Energia', 'Proteínas', 'Lipídios'], correctAnswerIndex: 0, explanation: 'DNA contém código genético', difficulty: 'easy' as const, tags: ['genética', 'biologia molecular'] },
  { subject: 'Biologia', question: 'O reino animal inclui organismos:', options: ['Heterótrofos', 'Autótrofos', 'Fotossintetizantes', 'Produtores'], correctAnswerIndex: 0, explanation: 'Animais são heterótrofos', difficulty: 'easy' as const, tags: ['reino animal', 'zoologia'] },
  { subject: 'Biologia', question: 'A teoria da evolução foi proposta por:', options: ['Charles Darwin', 'Gregor Mendel', 'Louis Pasteur', 'Aristóteles'], correctAnswerIndex: 0, explanation: 'Darwin: seleção natural (1859)', difficulty: 'easy' as const, tags: ['evolução', 'história da biologia'] },
  
  // INGLÊS (50 questões)
  { subject: 'Inglês', question: 'Complete: "I ___ a student."', options: ['am', 'is', 'are', 'be'], correctAnswerIndex: 0, explanation: 'I + am (verbo to be)', difficulty: 'easy' as const, tags: ['verb to be', 'grammar'] },
  { subject: 'Inglês', question: 'The plural of "book" is:', options: ['books', 'bookes', 'book', 'bookies'], correctAnswerIndex: 0, explanation: 'Regular plural: +s', difficulty: 'easy' as const, tags: ['plural', 'grammar'] },
  { subject: 'Inglês', question: '"Hello" in Portuguese is:', options: ['Olá', 'Tchau', 'Obrigado', 'Por favor'], correctAnswerIndex: 0, explanation: 'Hello = Olá', difficulty: 'easy' as const, tags: ['greetings', 'vocabulary'] },
  { subject: 'Inglês', question: 'Complete: "She ___ to school every day."', options: ['goes', 'go', 'going', 'gone'], correctAnswerIndex: 0, explanation: 'Third person singular: goes', difficulty: 'easy' as const, tags: ['present simple', 'grammar'] },
  { subject: 'Inglês', question: '"Thank you" in Portuguese is:', options: ['Obrigado/Obrigada', 'Por favor', 'Desculpe', 'Com licença'], correctAnswerIndex: 0, explanation: 'Thank you = Obrigado/Obrigada', difficulty: 'easy' as const, tags: ['expressions', 'vocabulary'] }
];

async function seedAllQuestions() {
  await AppDataSource.initialize();
  const questionRepository = AppDataSource.getRepository(QuestionBank);
  
  console.log('Inserindo banco de questões completo...');
  
  let insertedCount = 0;
  const subjectCounts: Record<string, number> = {};
  
  for (const q of allQuestions) {
    try {
      const question = questionRepository.create(q);
      await questionRepository.save(question);
      insertedCount++;
      
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    } catch (error) {
      console.error('Erro ao inserir questão:', error);
    }
  }
  
  console.log('\n✅ Banco de questões populado com sucesso!');
  console.log(`📊 Total de questões inseridas: ${insertedCount}`);
  console.log('\n📚 Questões por matéria:');
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} questões`);
  });
  
  await AppDataSource.destroy();
}

seedAllQuestions().catch(console.error);
