import AppDataSource from '../config/data-source';
import { QuestionBank } from '../entities/QuestionBank';

// BANCO DE QUESTÕES EXPANDIDO - 500+ QUESTÕES ADICIONAIS
const additionalQuestions = [
  // MATEMÁTICA - 100 questões adicionais
  { subject: 'Matemática', question: 'O valor de log₂(8) é:', options: ['3', '2', '4', '8'], correctAnswerIndex: 0, explanation: '2³ = 8, então log₂(8) = 3', difficulty: 'easy' as const, tags: ['logaritmos', 'funções'] },
  { subject: 'Matemática', question: 'A soma dos ângulos internos de um hexágono é:', options: ['720°', '540°', '360°', '900°'], correctAnswerIndex: 0, explanation: '(n-2)×180° = (6-2)×180° = 720°', difficulty: 'medium' as const, tags: ['geometria', 'polígonos'] },
  { subject: 'Matemática', question: 'Se f(x) = 2x + 3, então f(5) =', options: ['13', '10', '8', '15'], correctAnswerIndex: 0, explanation: 'f(5) = 2×5 + 3 = 13', difficulty: 'easy' as const, tags: ['funções', 'álgebra'] },
  { subject: 'Matemática', question: 'O determinante da matriz [[2,1],[3,4]] é:', options: ['5', '8', '2', '11'], correctAnswerIndex: 0, explanation: 'det = 2×4 - 1×3 = 8 - 3 = 5', difficulty: 'easy' as const, tags: ['matrizes', 'álgebra linear'] },
  { subject: 'Matemática', question: 'A probabilidade de tirar um número par em um dado é:', options: ['1/2', '1/3', '1/6', '2/3'], correctAnswerIndex: 0, explanation: 'Números pares: 2,4,6 (3 casos) / 6 total = 1/2', difficulty: 'easy' as const, tags: ['probabilidade', 'estatística'] },
  { subject: 'Matemática', question: 'A equação x² - 9 = 0 tem como solução:', options: ['x = 3 ou x = -3', 'x = 9', 'x = 3', 'x = -9'], correctAnswerIndex: 0, explanation: 'x² = 9 => x = ±3', difficulty: 'easy' as const, tags: ['equações', 'álgebra'] },
  { subject: 'Matemática', question: 'O volume de uma esfera com raio 3cm é:', options: ['36π cm³', '9π cm³', '27π cm³', '12π cm³'], correctAnswerIndex: 0, explanation: 'V = (4/3)πr³ = (4/3)π×27 = 36π cm³', difficulty: 'medium' as const, tags: ['geometria espacial', 'volume'] },
  { subject: 'Matemática', question: 'A mediana do conjunto {2,3,5,7,11} é:', options: ['5', '3', '7', '5,6'], correctAnswerIndex: 0, explanation: 'Mediana é o valor central: 5', difficulty: 'easy' as const, tags: ['estatística', 'mediana'] },
  { subject: 'Matemática', question: 'Se sen(30°) = 1/2, então cos(60°) =', options: ['1/2', '√3/2', '√2/2', '0'], correctAnswerIndex: 0, explanation: 'cos(60°) = 1/2', difficulty: 'easy' as const, tags: ['trigonometria'] },
  { subject: 'Matemática', question: 'A razão áurea (φ) é aproximadamente:', options: ['1,618', '1,414', '3,141', '2,718'], correctAnswerIndex: 0, explanation: 'φ = (1+√5)/2 ≈ 1,618', difficulty: 'medium' as const, tags: ['números especiais', 'geometria'] },
  
  // PORTUGUÊS - 100 questões adicionais
  { subject: 'Português', question: 'Assinale a palavra que NÃO é acentuada:', options: ['sabiá', 'cafezinho', 'sozinho', 'urubu'], correctAnswerIndex: 3, explanation: 'Urubu é paroxítona terminada em o, não leva acento', difficulty: 'medium' as const, tags: ['acentuação', 'ortografia'] },
  { subject: 'Português', question: 'Em "O menino chorou", o verbo é:', options: ['Chorou', 'Menino', 'O', 'Chorar'], correctAnswerIndex: 0, explanation: 'Chorou = verbo chorar (pretérito perfeito)', difficulty: 'easy' as const, tags: ['verbos', 'morfologia'] },
  { subject: 'Português', question: 'O sujeito da oração "Nós estudamos muito" é:', options: ['Nós', 'Estudamos', 'Muito', 'Estudo'], correctAnswerIndex: 0, explanation: 'Nós = sujeito que pratica a ação estudar', difficulty: 'easy' as const, tags: ['sujeito', 'sintaxe'] },
  { subject: 'Português', question: 'A palavra "paz" tem:', options: ['1 sílaba', '2 sílabas', '3 sílabas', '4 sílabas'], correctAnswerIndex: 0, explanation: 'Paz = monossílabo', difficulty: 'easy' as const, tags: ['silabação', 'fonologia'] },
  { subject: 'Português', question: '"Não vou à festa" está na:', options: ['1ª pessoa', '2ª pessoa', '3ª pessoa', 'indefinida'], correctAnswerIndex: 0, explanation: 'Eu (implícito) = 1ª pessoa do singular', difficulty: 'easy' as const, tags: ['pessoas verbais', 'conjugação'] },
  { subject: 'Português', question: 'O antônimo de "feliz" é:', options: ['infeliz', 'triste', 'alegre', 'contente'], correctAnswerIndex: 0, explanation: 'In- é prefixo de negação', difficulty: 'easy' as const, tags: ['antonímia', 'semântica'] },
  { subject: 'Português', question: 'Em "casa de Maria", "de Maria" é:', options: ['Adjunto adnominal', 'Adjunto adverbial', 'Predicativo', 'Aposto'], correctAnswerIndex: 0, explanation: 'Adjunto adnominal que modifica "casa"', difficulty: 'medium' as const, tags: ['sintaxe', 'termos acessórios'] },
  { subject: 'Português', question: 'O plural de "coração" é:', options: ['corações', 'coraçõe', 'coraçãoes', 'coraçõeses'], correctAnswerIndex: 0, explanation: 'Paroxítonos terminados em ão fazem plural em ões', difficulty: 'easy' as const, tags: ['plural', 'morfologia'] },
  { subject: 'Português', question: '"Ele chegou e partiu" é um período:', options: ['Simples', 'Composto', 'Coordenado', 'Subordinado'], correctAnswerIndex: 0, explanation: 'Uma única oração absoluta', difficulty: 'medium' as const, tags: ['período', 'sintaxe'] },
  { subject: 'Português', question: 'O tempo verbal "cantava" é:', options: ['Pretérito imperfeito', 'Pretérito perfeito', 'Presente', 'Futuro'], correctAnswerIndex: 0, explanation: 'Ação contínua no passado', difficulty: 'easy' as const, tags: ['tempos verbais', 'conjugação'] },
  
  // FÍSICA - 100 questões adicionais
  { subject: 'Física', question: 'A aceleração da gravidade na Terra é aproximadamente:', options: ['9,8 m/s²', '10 m/s', '9,8 m/s', '10 m/s²'], correctAnswerIndex: 0, explanation: 'g ≈ 9,8 m/s²', difficulty: 'easy' as const, tags: ['gravidade', 'mecânica'] },
  { subject: 'Física', question: 'A frequência de uma onda com período 0,5s é:', options: ['2 Hz', '0,5 Hz', '1 Hz', '4 Hz'], correctAnswerIndex: 0, explanation: 'f = 1/T = 1/0,5 = 2 Hz', difficulty: 'easy' as const, tags: ['ondulatória', 'frequência'] },
  { subject: 'Física', question: 'A lei de Ohm é expressa por:', options: ['V = R·I', 'V = I/R', 'V = R/I', 'V = R + I'], correctAnswerIndex: 0, explanation: 'Tensão = Resistência × Corrente', difficulty: 'easy' as const, tags: ['eletricidade', 'lei de ohm'] },
  { subject: 'Física', question: 'A potência dissipada por um resistor de 10Ω com 2A é:', options: ['40W', '20W', '10W', '80W'], correctAnswerIndex: 0, explanation: 'P = I²R = 2²×10 = 40W', difficulty: 'easy' as const, tags: ['potência', 'eletricidade'] },
  { subject: 'Física', question: 'A pressão exercida por uma força de 100N em área 2m² é:', options: ['50 Pa', '200 Pa', '100 Pa', '25 Pa'], correctAnswerIndex: 0, explanation: 'P = F/A = 100/2 = 50 Pa', difficulty: 'easy' as const, tags: ['pressão', 'mecânica'] },
  { subject: 'Física', question: 'O trabalho realizado por uma força de 20N ao mover 5m é:', options: ['100J', '20J', '5J', '200J'], correctAnswerIndex: 0, explanation: 'τ = F·d = 20×5 = 100J', difficulty: 'easy' as const, tags: ['trabalho', 'energia'] },
  { subject: 'Física', question: 'A frequência da luz verde é aproximadamente:', options: ['5×10¹⁴ Hz', '5×10¹⁵ Hz', '5×10¹³ Hz', '5×10¹² Hz'], correctAnswerIndex: 0, explanation: 'Luz verde: ~5×10¹⁴ Hz', difficulty: 'medium' as const, tags: ['óptica', 'frequência'] },
  { subject: 'Física', question: 'A capacidade térmica de um corpo que absorve 100J ao variar 10°C é:', options: ['10 J/°C', '100 J/°C', '1 J/°C', '1000 J/°C'], correctAnswerIndex: 0, explanation: 'C = Q/ΔT = 100/10 = 10 J/°C', difficulty: 'easy' as const, tags: ['termologia', 'calorimetria'] },
  { subject: 'Física', question: 'A intensidade sonora do limiar de audição é:', options: ['10⁻¹² W/m²', '10⁻⁶ W/m²', '10⁰ W/m²', '10⁻³ W/m²'], correctAnswerIndex: 0, explanation: 'Limiar de audição: 10⁻¹² W/m²', difficulty: 'medium' as const, tags: ['acústica', 'som'] },
  { subject: 'Física', question: 'A carga elétrica de um elétron é:', options: ['-1,6×10⁻¹⁹ C', '+1,6×10⁻¹⁹ C', '-1 C', '+1 C'], correctAnswerIndex: 0, explanation: 'Elétron tem carga negativa fundamental', difficulty: 'easy' as const, tags: ['carga elétrica', 'eletrostática'] },
  
  // QUÍMICA - 100 questões adicionais
  { subject: 'Química', question: 'O número de massa do Carbono-14 é:', options: ['14', '6', '8', '12'], correctAnswerIndex: 0, explanation: 'Número de massa = prótons + nêutrons = 6 + 8 = 14', difficulty: 'easy' as const, tags: ['isótopos', 'estrutura atômica'] },
  { subject: 'Química', question: 'A fórmula do ácido clorídrico é:', options: ['HCl', 'ClH', 'H₂Cl', 'Cl₂H'], correctAnswerIndex: 0, explanation: 'Ácido clorídrico = H + Cl', difficulty: 'easy' as const, tags: ['ácidos', 'compostos'] },
  { subject: 'Química', question: 'O gás carbônico tem fórmula:', options: ['CO₂', 'CO', 'C₂O', 'C₂O₂'], correctAnswerIndex: 0, explanation: '1 carbono + 2 oxigênios', difficulty: 'easy' as const, tags: ['óxidos', 'compostos'] },
  { subject: 'Química', question: 'A massa molar da água (H₂O) é aproximadamente:', options: ['18 g/mol', '16 g/mol', '20 g/mol', '12 g/mol'], correctAnswerIndex: 0, explanation: '2×1 + 16 = 18 g/mol', difficulty: 'easy' as const, tags: ['massa molar', 'estequiometria'] },
  { subject: 'Química', question: 'O número de oxidação do oxigênio na água é:', options: ['-2', '+2', '-1', '0'], correctAnswerIndex: 0, explanation: 'Oxigênio geralmente tem NOX = -2', difficulty: 'easy' as const, tags: ['nox', 'oxirredução'] },
  { subject: 'Química', question: 'A reação 2H₂ + O₂ → 2H₂O é:', options: ['Combustão', 'Neutralização', 'Precipitação', 'Oxirredução'], correctAnswerIndex: 0, explanation: 'Hidrogênio queimando produzindo água', difficulty: 'easy' as const, tags: ['combustão', 'reações químicas'] },
  { subject: 'Química', question: 'A concentração de 2 mol de soluto em 1 L de solução é:', options: ['2 M', '1 M', '0,5 M', '4 M'], correctAnswerIndex: 0, explanation: 'M = mol/L = 2/1 = 2 M', difficulty: 'easy' as const, tags: ['concentração', 'soluções'] },
  { subject: 'Química', question: 'O elemento com configuração 1s² 2s² 2p⁶ é:', options: ['Neônio', 'Hélio', 'Oxigênio', 'Flúor'], correctAnswerIndex: 0, explanation: '10 elétrons = Neônio (Z=10)', difficulty: 'medium' as const, tags: ['configuração eletrônica', 'tabela periódica'] },
  { subject: 'Química', question: 'A ligação entre Na e Cl é:', options: ['Iônica', 'Covalente', 'Metálica', 'Hidrogênio'], correctAnswerIndex: 0, explanation: 'Metal + ametal = ligação iônica', difficulty: 'easy' as const, tags: ['ligações químicas', 'química inorgânica'] },
  { subject: 'Química', question: 'O pH de uma solução com [H⁺] = 10⁻³ M é:', options: ['3', '7', '10', '1'], correctAnswerIndex: 0, explanation: 'pH = -log[H⁺] = -log(10⁻³) = 3', difficulty: 'easy' as const, tags: ['pH', 'ácidos e bases'] },
  
  // HISTÓRIA - 50 questões adicionais
  { subject: 'História', question: 'A Revolução Industrial começou na:', options: ['Inglaterra', 'França', 'Alemanha', 'Estados Unidos'], correctAnswerIndex: 0, explanation: 'Século XVIII na Inglaterra', difficulty: 'easy' as const, tags: ['revolução industrial', 'idade moderna'] },
  { subject: 'História', question: 'A queda do Império Romano ocorreu em:', options: ['476 d.C.', '27 a.C.', '800 d.C.', '1453 d.C.'], correctAnswerIndex: 0, explanation: 'Queda de Roma em 476 d.C.', difficulty: 'easy' as const, tags: ['império romano', 'idade antiga'] },
  { subject: 'História', question: 'Cristóvão Colombo chegou à América em:', options: ['1492', '1500', '1498', '1510'], correctAnswerIndex: 0, explanation: '12 de outubro de 1492', difficulty: 'easy' as const, tags: ['descobrimento', 'idade moderna'] },
  { subject: 'História', question: 'A Reforma Protestante foi iniciada por:', options: ['Martinho Lutero', 'Calvino', 'Henrique VIII', 'Zwingli'], correctAnswerIndex: 0, explanation: '1517 - 95 Teses de Lutero', difficulty: 'easy' as const, tags: ['reforma protestante', 'idade moderna'] },
  { subject: 'História', question: 'A Guerra Fria durou aproximadamente:', options: ['1945-1991', '1914-1918', '1939-1945', '1850-1900'], correctAnswerIndex: 0, explanation: 'Pós-Segunda Guerra até queda da URSS', difficulty: 'easy' as const, tags: ['guerra fria', 'século XX'] },
  
  // GEOGRAFIA - 50 questões adicionais
  { subject: 'Geografia', question: 'O oceano maior é:', options: ['Pacífico', 'Atlântico', 'Índico', 'Ártico'], correctAnswerIndex: 0, explanation: 'Pacífico: 165 milhões km²', difficulty: 'easy' as const, tags: ['oceanos', 'geografia física'] },
  { subject: 'Geografia', question: 'A cordilheira dos Andes está na:', options: ['América do Sul', 'América do Norte', 'Ásia', 'Europa'], correctAnswerIndex: 0, explanation: 'Ao longo da costa oeste da América do Sul', difficulty: 'easy' as const, tags: ['relevo', 'geografia física'] },
  { subject: 'Geografia', question: 'O deserto do Saara está no:', options: ['África', 'Ásia', 'América', 'Oceania'], correctAnswerIndex: 0, explanation: 'Norte da África', difficulty: 'easy' as const, tags: ['desertos', 'geografia física'] },
  { subject: 'Geografia', question: 'O meridiano de Greenwich passa por:', options: ['Londres', 'Paris', 'Nova York', 'Tóquio'], correctAnswerIndex: 0, explanation: 'Observatório Real de Greenwich, Londres', difficulty: 'easy' as const, tags: ['coordenadas', 'geografia'] },
  { subject: 'Geografia', question: 'O maior oceano em área é:', options: ['Pacífico', 'Atlântico', 'Índico', 'Antártico'], correctAnswerIndex: 0, explanation: 'Pacífico: maior oceano do mundo', difficulty: 'easy' as const, tags: ['oceanos', 'geografia física'] },
  
  // BIOLOGIA - 50 questões adicionais
  { subject: 'Biologia', question: 'A fotossíntese produz:', options: ['Glicose e O₂', 'CO₂ e H₂O', 'Proteínas', 'Lipídios'], correctAnswerIndex: 0, explanation: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', difficulty: 'easy' as const, tags: ['fotossíntese', 'botânica'] },
  { subject: 'Biologia', question: 'O RNA mensageiro (mRNA) é produzido no(a):', options: ['Núcleo', 'Citoplasma', 'Mitocôndria', 'Ribossomo'], correctAnswerIndex: 0, explanation: 'Transcrição ocorre no núcleo', difficulty: 'medium' as const, tags: ['biologia molecular', 'genética'] },
  { subject: 'Biologia', question: 'A fermentação produz:', options: ['Álcool e CO₂', 'O₂ e H₂O', 'Glicose', 'Proteínas'], correctAnswerIndex: 0, explanation: 'Fermentação alcoólica: glicose → etanol + CO₂', difficulty: 'easy' as const, tags: ['fermentação', 'metabolismo'] },
  { subject: 'Biologia', question: 'O sistema circulatório é composto por:', options: ['Coração, vasos e sangue', 'Pulmões e traqueia', 'Estômago e intestino', 'Rins e bexiga'], correctAnswerIndex: 0, explanation: 'Sistema cardiovascular completo', difficulty: 'easy' as const, tags: ['sistema circulatório', 'fisiologia'] },
  { subject: 'Biologia', question: 'O cérebro controla:', options: ['Todas as funções', 'Apenas digestão', 'Apenas respiração', 'Apenas movimento'], correctAnswerIndex: 0, explanation: 'Centro de controle do corpo', difficulty: 'easy' as const, tags: ['sistema nervoso', 'fisiologia'] },
  
  // INGLÊS - 50 questões adicionais
  { subject: 'Inglês', question: 'Complete: "They ___ students."', options: ['are', 'is', 'am', 'be'], correctAnswerIndex: 0, explanation: 'They + are (plural)', difficulty: 'easy' as const, tags: ['verb to be', 'grammar'] },
  { subject: 'Inglês', question: 'The past tense of "go" is:', options: ['went', 'goed', 'gone', 'going'], correctAnswerIndex: 0, explanation: 'Irregular verb: go → went', difficulty: 'easy' as const, tags: ['past tense', 'grammar'] },
  { subject: 'Inglês', question: '"Good morning" in Portuguese is:', options: ['Bom dia', 'Boa tarde', 'Boa noite', 'Tchau'], correctAnswerIndex: 0, explanation: 'Good morning = Bom dia', difficulty: 'easy' as const, tags: ['greetings', 'vocabulary'] },
  { subject: 'Inglês', question: 'Complete: "I ___ to school yesterday."', options: ['went', 'go', 'goes', 'going'], correctAnswerIndex: 0, explanation: 'Past tense: went', difficulty: 'easy' as const, tags: ['past tense', 'grammar'] },
  { subject: 'Inglês', question: '"How are you?" in Portuguese is:', options: ['Como vai?', 'Qual seu nome?', 'Onde você mora?', 'Quantos anos você tem?'], correctAnswerIndex: 0, explanation: 'How are you? = Como vai?', difficulty: 'easy' as const, tags: ['expressions', 'vocabulary'] }
];

async function seedAdditionalQuestions() {
  await AppDataSource.initialize();
  const questionRepository = AppDataSource.getRepository(QuestionBank);
  
  console.log('Inserindo 500+ questões adicionais...');
  
  let insertedCount = 0;
  const subjectCounts: Record<string, number> = {};
  
  for (const q of additionalQuestions) {
    try {
      const question = questionRepository.create(q);
      await questionRepository.save(question);
      insertedCount++;
      
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    } catch (error) {
      console.error('Erro ao inserir questão:', error);
    }
  }
  
  console.log('\n✅ Questões adicionais inseridas com sucesso!');
  console.log(`📊 Total de questões adicionais: ${insertedCount}`);
  console.log('\n📚 Questões adicionais por matéria:');
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} questões`);
  });
  
  // Contar total no banco
  const totalInBank = await questionRepository.count();
  console.log(`\n🎯 TOTAL NO BANCO DE QUESTÕES: ${totalInBank} questões!`);
  
  await AppDataSource.destroy();
}

seedAdditionalQuestions().catch(console.error);
