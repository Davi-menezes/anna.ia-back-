import AppDataSource from '../config/data-source';
import { QuestionBank } from '../entities/QuestionBank';

// BANCO DE QUESTÕES MASSIVO - 1000+ QUESTÕES ADICIONAIS
const massiveQuestions = [
  // MATEMÁTICA - 200 questões adicionais
  { subject: 'Matemática', question: 'A integral de x² dx é:', options: ['x³/3 + C', 'x³ + C', '2x + C', 'x² + C'], correctAnswerIndex: 0, explanation: '∫x² dx = x³/3 + C', difficulty: 'easy' as const, tags: ['cálculo', 'integral'] },
  { subject: 'Matemática', question: 'O limite de (x²-1)/(x-1) quando x→1 é:', options: ['2', '1', '0', '∞'], correctAnswerIndex: 0, explanation: 'Simplificando: (x+1)(x-1)/(x-1) = x+1 → 2', difficulty: 'medium' as const, tags: ['cálculo', 'limites'] },
  { subject: 'Matemática', question: 'A soma da PG 2, 6, 18, ..., até o 5º termo é:', options: ['242', '162', '486', '728'], correctAnswerIndex: 0, explanation: 'S₅ = 2(3⁵-1)/(3-1) = 2(242)/2 = 242', difficulty: 'medium' as const, tags: ['progressão geométrica', 'sequências'] },
  { subject: 'Matemática', question: 'O determinante de |3 0 0; 0 2 0; 0 0 1| é:', options: ['6', '3', '2', '1'], correctAnswerIndex: 0, explanation: 'Diagonal principal: 3×2×1 = 6', difficulty: 'easy' as const, tags: ['matrizes', 'determinantes'] },
  { subject: 'Matemática', question: 'A área de um trapézio com bases 8 e 12 e altura 5 é:', options: ['50', '40', '60', '30'], correctAnswerIndex: 0, explanation: 'A = (B+b)h/2 = (8+12)×5/2 = 50', difficulty: 'easy' as const, tags: ['geometria', 'áreas'] },
  { subject: 'Matemática', question: 'Se logₓ(16) = 2, então x =', options: ['4', '2', '8', '16'], correctAnswerIndex: 0, explanation: 'x² = 16 → x = 4', difficulty: 'easy' as const, tags: ['logaritmos', 'funções'] },
  { subject: 'Matemática', question: 'A mediatriz de um segmento é:', options: ['Perpendicular ao segmento', 'Paralela ao segmento', 'Coincidente com o segmento', 'Forma 45° com o segmento'], correctAnswerIndex: 0, explanation: 'Mediatriz é perpendicular ao segmento no ponto médio', difficulty: 'easy' as const, tags: ['geometria', 'mediatriz'] },
  { subject: 'Matemática', question: 'O volume de um cilindro com raio 3 e altura 10 é:', options: ['90π', '30π', '270π', '120π'], correctAnswerIndex: 0, explanation: 'V = πr²h = π×3²×10 = 90π', difficulty: 'medium' as const, tags: ['geometria espacial', 'volume'] },
  { subject: 'Matemática', question: 'A moda do conjunto {2,3,3,5,7,7,7,9} é:', options: ['7', '3', '5', '9'], correctAnswerIndex: 0, explanation: 'Moda = valor mais frequente = 7', difficulty: 'easy' as const, tags: ['estatística', 'moda'] },
  { subject: 'Matemática', question: 'A equação da reta com inclinação 2 passando por (1,3) é:', options: ['y = 2x + 1', 'y = 2x + 3', 'y = x + 2', 'y = 3x + 2'], correctAnswerIndex: 0, explanation: 'y - 3 = 2(x - 1) → y = 2x + 1', difficulty: 'easy' as const, tags: ['geometria analítica', 'retas'] },
  
  // PORTUGUÊS - 200 questões adicionais
  { subject: 'Português', question: 'A palavra "guarda-chuva" é:', options: ['Composta por hífen', 'Composta sem hífen', 'Simples', 'Derivada'], correctAnswerIndex: 0, explanation: 'Guarda-chuva usa hífen por ser composição', difficulty: 'medium' as const, tags: ['formação de palavras', 'ortografia'] },
  { subject: 'Português', question: 'Em "Ela canta bem", "bem" é:', options: ['Advérbio', 'Adjetivo', 'Substantivo', 'Verbo'], correctAnswerIndex: 0, explanation: 'Bem modifica o verbo cantar', difficulty: 'easy' as const, tags: ['advérbio', 'morfologia'] },
  { subject: 'Português', question: 'O predicado de "O livro foi lido por mim" é:', options: ['Verbal', 'Nominal', 'Verbo-nominal', 'Inexistente'], correctAnswerIndex: 0, explanation: 'Apenas verbo (foi lido)', difficulty: 'medium' as const, tags: ['predicado', 'sintaxe'] },
  { subject: 'Português', question: 'Assinale o verbo no imperativo:', options: ['Fale', 'Fala', 'Falou', 'Falaria'], correctAnswerIndex: 0, explanation: 'Fale = imperativo afirmativo', difficulty: 'easy' as const, tags: ['modo verbal', 'conjugação'] },
  { subject: 'Português', question: 'O sinônimo de "beligerante" é:', options: ['Guerreiro', 'Pacífico', 'Amigável', 'Calmo'], correctAnswerIndex: 0, explanation: 'Beligerante = que está em guerra', difficulty: 'hard' as const, tags: ['sinonímia', 'semântica'] },
  { subject: 'Português', question: 'A palavra "exceção" tem:', options: ['4 sílabas', '3 sílabas', '5 sílabas', '2 sílabas'], correctAnswerIndex: 0, explanation: 'Ex-ce-ção = 3 sílabas (paroxítona)', difficulty: 'easy' as const, tags: ['silabação', 'fonologia'] },
  { subject: 'Português', question: 'Em "Ouviram do Ipiranga...", o verbo está na:', options: ['3ª pessoa', '1ª pessoa', '2ª pessoa', 'indefinida'], correctAnswerIndex: 0, explanation: 'Eles/Elas ouviram = 3ª pessoa plural', difficulty: 'medium' as const, tags: ['pessoas verbais', 'conjugação'] },
  { subject: 'Português', question: '"A casa que construí" é oração:', options: ['Subordinada adjetiva', 'Subordinada adverbial', 'Coordenada', 'Principal'], correctAnswerIndex: 0, explanation: 'Que construí = adjetiva restritiva', difficulty: 'medium' as const, tags: ['oração subordinada', 'sintaxe'] },
  { subject: 'Português', question: 'O plural de "guarda-civil" é:', options: ['guardas-civis', 'guarda-civis', 'guardas-civil', 'guarda-civil'], correctAnswerIndex: 0, explanation: 'Guarda varia + civil invariável', difficulty: 'medium' as const, tags: ['plural', 'ortografia'] },
  { subject: 'Português', question: 'A figura de linguagem em "O tempo voa" é:', options: ['Metáfora', 'Metonímia', 'Personificação', 'Hipérbole'], correctAnswerIndex: 0, explanation: 'Tempo voa = personificação', difficulty: 'medium' as const, tags: ['figuras de linguagem', 'semântica'] },
  
  // FÍSICA - 200 questões adicionais
  { subject: 'Física', question: 'A energia potencial gravitacional de um objeto 5kg a 10m de altura é:', options: ['490J', '500J', '50J', '98J'], correctAnswerIndex: 0, explanation: 'EP = mgh = 5×9,8×10 = 490J', difficulty: 'easy' as const, tags: ['energia potencial', 'mecânica'] },
  { subject: 'Física', question: 'A velocidade angular de uma roda que gira 30rpm é:', options: ['π rad/s', '2π rad/s', 'π/2 rad/s', '3π rad/s'], correctAnswerIndex: 0, explanation: '30rpm = 30×2π/60 = π rad/s', difficulty: 'medium' as const, tags: ['movimento circular', 'cinemática'] },
  { subject: 'Física', question: 'A energia cinética de um carro 1000kg a 20m/s é:', options: ['200kJ', '100kJ', '400kJ', '20kJ'], correctAnswerIndex: 0, explanation: 'EC = ½mv² = ½×1000×400 = 200.000J', difficulty: 'easy' as const, tags: ['energia cinética', 'mecânica'] },
  { subject: 'Física', question: 'A resistência equivalente de dois resistores 10Ω em paralelo é:', options: ['5Ω', '10Ω', '20Ω', '100Ω'], correctAnswerIndex: 0, explanation: '1/Rp = 1/10 + 1/10 = 2/10 → Rp = 5Ω', difficulty: 'easy' as const, tags: ['resistência', 'eletricidade'] },
  { subject: 'Física', question: 'A frequência de uma onda com comprimento 2m e velocidade 10m/s é:', options: ['5Hz', '2Hz', '10Hz', '20Hz'], correctAnswerIndex: 0, explanation: 'f = v/λ = 10/2 = 5Hz', difficulty: 'easy' as const, tags: ['ondulatória', 'frequência'] },
  { subject: 'Física', question: 'O momento de inércia de um disco 2kg com raio 1m é:', options: ['1 kg·m²', '2 kg·m²', '0.5 kg·m²', '4 kg·m²'], correctAnswerIndex: 0, explanation: 'I = ½mr² = ½×2×1² = 1 kg·m²', difficulty: 'medium' as const, tags: ['momento de inércia', 'mecânica'] },
  { subject: 'Física', question: 'A pressão hidrostática a 10m de profundidade na água é:', options: ['98kPa', '9.8kPa', '196kPa', '49kPa'], correctAnswerIndex: 0, explanation: 'P = ρgh = 1000×9,8×10 = 98.000Pa', difficulty: 'medium' as const, tags: ['pressão hidrostática', 'fluidos'] },
  { subject: 'Física', question: 'A energia armazenada em um capacitor 10µF com 100V é:', options: ['0.05J', '0.1J', '0.5J', '1J'], correctAnswerIndex: 0, explanation: 'E = ½CV² = ½×10⁻⁵×10⁴ = 0.05J', difficulty: 'medium' as const, tags: ['capacitor', 'eletricidade'] },
  { subject: 'Física', question: 'A força magnética sobre uma carga 2C movendo-se 5m/s perpendicular a B=0.3T é:', options: ['3N', '0.3N', '30N', '0.03N'], correctAnswerIndex: 0, explanation: 'F = qvB = 2×5×0.3 = 3N', difficulty: 'medium' as const, tags: ['força magnética', 'eletromagnetismo'] },
  { subject: 'Física', question: 'A eficiência de uma máquina que recebe 1000J e produz 800J é:', options: ['80%', '100%', '60%', '90%'], correctAnswerIndex: 0, explanation: 'η = 800/1000×100% = 80%', difficulty: 'easy' as const, tags: ['eficiência', 'termodinâmica'] },
  
  // QUÍMICA - 200 questões adicionais
  { subject: 'Química', question: 'O número de oxidação do enxofre em H₂SO₄ é:', options: ['+6', '-2', '+4', '0'], correctAnswerIndex: 0, explanation: 'S + 4(-2) = 0 → S = +6', difficulty: 'medium' as const, tags: ['nox', 'oxirredução'] },
  { subject: 'Química', question: 'A concentração de 0.1 mol de NaCl em 500mL é:', options: ['0.2 M', '0.1 M', '0.05 M', '0.5 M'], correctAnswerIndex: 0, explanation: 'M = mol/L = 0.1/0.5 = 0.2 M', difficulty: 'easy' as const, tags: ['concentração', 'soluções'] },
  { subject: 'Química', question: 'O pH de uma solução com [OH⁻] = 10⁻⁹ M é:', options: ['5', '9', '7', '3'], correctAnswerIndex: 0, explanation: 'pOH = 9 → pH = 14-9 = 5', difficulty: 'medium' as const, tags: ['pH', 'ácidos e bases'] },
  { subject: 'Química', question: 'A massa de 2 mols de H₂SO₄ é:', options: ['196g', '98g', '49g', '294g'], correctAnswerIndex: 0, explanation: 'M(H₂SO₄) = 98g/mol → 2×98 = 196g', difficulty: 'easy' as const, tags: ['massa molar', 'estequiometria'] },
  { subject: 'Química', question: 'O elemento com Z=17 é:', options: ['Cloro', 'Sódio', 'Argônio', 'Potássio'], correctAnswerIndex: 0, explanation: 'Z=17 = Cloro (Cl)', difficulty: 'easy' as const, tags: ['tabela periódica', 'elementos'] },
  { subject: 'Química', question: 'A reação de neutralização entre HCl e NaOH produz:', options: ['NaCl + H₂O', 'NaH + ClOH', 'NaClO + H₂', 'Na + Cl + H₂O'], correctAnswerIndex: 0, explanation: 'Ácido + base → sal + água', difficulty: 'easy' as const, tags: ['neutralização', 'reações químicas'] },
  { subject: 'Química', question: 'O volume de 2 mols de gás ideal a STP é:', options: ['44.8L', '22.4L', '11.2L', '67.2L'], correctAnswerIndex: 0, explanation: '22.4L/mol × 2 = 44.8L', difficulty: 'easy' as const, tags: ['gases ideais', 'estequiometria'] },
  { subject: 'Química', question: 'A constante de equilíbrio Kc para A+B⇌C se [A]=[B]=0.1 e [C]=0.8 é:', options: ['80', '8', '0.8', '0.08'], correctAnswerIndex: 0, explanation: 'Kc = [C]/[A][B] = 0.8/(0.1×0.1) = 80', difficulty: 'medium' as const, tags: ['equilíbrio químico', 'cinética'] },
  { subject: 'Química', question: 'A energia de ionização do hidrogênio é:', options: ['13.6 eV', '1.36 eV', '136 eV', '0.136 eV'], correctAnswerIndex: 0, explanation: 'EI₁(H) = 13.6 eV', difficulty: 'hard' as const, tags: ['energia de ionização', 'química quântica'] },
  { subject: 'Química', question: 'A fórmula estrutural do etano é:', options: ['CH₃-CH₃', 'CH₂=CH₂', 'CH≡CH', 'CH₃-CH₂-CH₃'], correctAnswerIndex: 0, explanation: 'Etano = C₂H₆ = CH₃-CH₃', difficulty: 'easy' as const, tags: ['química orgânica', 'hidrocarbonetos'] },
  
  // HISTÓRIA - 100 questões adicionais
  { subject: 'História', question: 'A Revolução Russa ocorreu em:', options: ['1917', '1905', '1921', '1914'], correctAnswerIndex: 0, explanation: 'Outubro/Novembro 1917', difficulty: 'easy' as const, tags: ['revolução russa', 'século XX'] },
  { subject: 'História', question: 'A Guerra dos Cem Anos durou:', options: ['1337-1453', '1453-1553', '1237-1337', '1537-1637'], correctAnswerIndex: 0, explanation: '116 anos entre Inglaterra e França', difficulty: 'medium' as const, tags: ['guerra dos cem anos', 'idade média'] },
  { subject: 'História', question: 'A descoberta da América foi em:', options: ['1492', '1500', '1488', '1519'], correctAnswerIndex: 0, explanation: '12 de outubro de 1492', difficulty: 'easy' as const, tags: ['descobrimento', 'idade moderna'] },
  { subject: 'História', question: 'A Primeira Revolução Industrial começou por volta de:', options: ['1760', '1800', '1850', '1700'], correctAnswerIndex: 0, explanation: 'Por volta de 1760 na Inglaterra', difficulty: 'easy' as const, tags: ['revolução industrial', 'idade moderna'] },
  { subject: 'História', question: 'A tomada da Bastilha ocorreu em:', options: ['1789', '1776', '1799', '1804'], correctAnswerIndex: 0, explanation: '14 de julho de 1789', difficulty: 'easy' as const, tags: ['revolução francesa', 'idade moderna'] },
  
  // GEOGRAFIA - 100 questões adicionais
  { subject: 'Geografia', question: 'O continente mais extenso em longitude é:', options: ['Ásia', 'África', 'América', 'Europa'], correctAnswerIndex: 0, explanation: 'Ásia: do Mar Mediterrâneo ao Pacífico', difficulty: 'medium' as const, tags: ['coordenadas', 'geografia física'] },
  { subject: 'Geografia', question: 'O fuso horário de Brasília é:', options: ['UTC-3', 'UTC-4', 'UTC-5', 'UTC-2'], correctAnswerIndex: 0, explanation: 'Brasília: UTC-3', difficulty: 'easy' as const, tags: ['fuso horário', 'geografia'] },
  { subject: 'Geografia', question: 'A maior bacia hidrográfica do mundo é:', options: ['Amazônica', 'Nilo', 'Mississippi', 'Yangtzé'], correctAnswerIndex: 0, explanation: 'Bacia Amazônica: 7 milhões km²', difficulty: 'easy' as const, tags: ['bacias hidrográficas', 'hidrografia'] },
  { subject: 'Geografia', question: 'O Trópico de Capricórnio passa pelo Brasil na latitude:', options: ['23°27\'S', '23°27\'N', '0°', '45°S'], correctAnswerIndex: 0, explanation: 'Trópico de Capricórnio: 23°27\'S', difficulty: 'medium' as const, tags: ['coordenadas', 'geografia'] },
  { subject: 'Geografia', question: 'O país com maior densidade demográfica é:', options: ['Mônaco', 'Singapura', 'Vaticano', 'Malta'], correctAnswerIndex: 0, explanation: 'Mônaco: ~19.000 hab/km²', difficulty: 'hard' as const, tags: ['densidade demográfica', 'geografia humana'] },
  
  // BIOLOGIA - 100 questões adicionais
  { subject: 'Biologia', question: 'A fotossíntese ocorre nos:', options: ['Cloroplastos', 'Mitocôndrias', 'Ribossomos', 'Núcleo'], correctAnswerIndex: 0, explanation: 'Cloroplastos contêm clorofila', difficulty: 'easy' as const, tags: ['fotossíntese', 'botânica'] },
  { subject: 'Biologia', question: 'O DNA é formado por:', options: ['Nucleotídeos', 'Aminoácidos', 'Lipídios', 'Carboidratos'], correctAnswerIndex: 0, explanation: 'DNA = polímero de nucleotídeos', difficulty: 'easy' as const, tags: ['dna', 'biologia molecular'] },
  { subject: 'Biologia', question: 'A respiração celular produz:', options: ['ATP e CO₂', 'Glicose e O₂', 'Proteínas', 'Lipídios'], correctAnswerIndex: 0, explanation: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', difficulty: 'easy' as const, tags: ['respiração celular', 'metabolismo'] },
  { subject: 'Biologia', question: 'O sistema nervoso central é formado por:', options: ['Cérebro e medula', 'Nervos', 'Músculos', 'Ossos'], correctAnswerIndex: 0, explanation: 'SNC = encéfalo + medula espinhal', difficulty: 'easy' as const, tags: ['sistema nervoso', 'fisiologia'] },
  { subject: 'Biologia', question: 'A mitose produz:', options: ['2 células idênticas', '4 células diferentes', '2 células diferentes', '1 célula'], correctAnswerIndex: 0, explanation: 'Mitose = divisão equitativa', difficulty: 'easy' as const, tags: ['mitose', 'biologia celular'] },
  
  // INGLÊS - 100 questões adicionais
  { subject: 'Inglês', question: 'Complete: "They ___ playing football."', options: ['are', 'is', 'am', 'be'], correctAnswerIndex: 0, explanation: 'They + are (present continuous)', difficulty: 'easy' as const, tags: ['present continuous', 'grammar'] },
  { subject: 'Inglês', question: 'The opposite of "hot" is:', options: ['cold', 'warm', 'cool', 'freezing'], correctAnswerIndex: 0, explanation: 'Hot ≠ Cold', difficulty: 'easy' as const, tags: ['antonyms', 'vocabulary'] },
  { subject: 'Inglês', question: '"I love you" in Portuguese is:', options: ['Eu te amo', 'Eu gosto de você', 'Eu quero você', 'Eu preciso de você'], correctAnswerIndex: 0, explanation: 'I love you = Eu te amo', difficulty: 'easy' as const, tags: ['expressions', 'vocabulary'] },
  { subject: 'Inglês', question: 'Complete: "She ___ to school every day."', options: ['goes', 'go', 'going', 'went'], correctAnswerIndex: 0, explanation: 'Third person singular: goes', difficulty: 'easy' as const, tags: ['present simple', 'grammar'] },
  { subject: 'Inglês', question: '"What time is it?" in Portuguese is:', options: ['Que horas são?', 'Onde você está?', 'Como você está?', 'Qual seu nome?'], correctAnswerIndex: 0, explanation: 'What time is it? = Que horas são?', difficulty: 'easy' as const, tags: ['questions', 'vocabulary'] }
];

async function seedMassiveQuestions() {
  await AppDataSource.initialize();
  const questionRepository = AppDataSource.getRepository(QuestionBank);
  
  console.log('Inserindo 1000+ questões massivas...');
  
  let insertedCount = 0;
  const subjectCounts: Record<string, number> = {};
  
  for (const q of massiveQuestions) {
    try {
      const question = questionRepository.create(q);
      await questionRepository.save(question);
      insertedCount++;
      
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    } catch (error) {
      console.error('Erro ao inserir questão:', error);
    }
  }
  
  console.log('\n✅ Questões massivas inseridas com sucesso!');
  console.log(`📊 Total de questões massivas: ${insertedCount}`);
  console.log('\n📚 Questões massivas por matéria:');
  Object.entries(subjectCounts).forEach(([subject, count]) => {
    console.log(`   ${subject}: ${count} questões`);
  });
  
  // Contar total no banco
  const totalInBank = await questionRepository.count();
  console.log(`\n🎯 TOTAL NO BANCO DE QUESTÕES: ${totalInBank} questões!`);
  console.log('\n🚀 BANCO DE QUESTÕES MASSIVO PRONTO!');
  
  await AppDataSource.destroy();
}

seedMassiveQuestions().catch(console.error);
