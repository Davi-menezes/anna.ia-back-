# Importação de Questões do ENEM

Este serviço permite importar questões reais do ENEM (2009-2023) diretamente da API pública [enem.dev](https://enem.dev) para o banco de dados do Anna.IA.

## 📊 Dados Disponíveis

- **2700+ questões reais** do ENEM
- **Anos disponíveis**: 2009 a 2023
- **Matérias**: 
  - Ciências Humanas → História
  - Ciências da Natureza → Biologia
  - Linguagens → Português
  - Matemática → Matemática

## 🚀 Instalação

1. Instale a dependência necessária:
```bash
cd anna.ia-back
npm install axios
```

2. Configure as variáveis de ambiente no arquivo `.env`:
```bash
# Configurações do banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=anna_ia
```

## 📥 Como Usar

### Importar Todas as Questões (2009-2023)
```bash
npm run import:enem:all
```

### Importar por Ano Específico
```bash
# Importar apenas questões de 2023
npm run import:enem:2023

# Importar apenas questões de 2022
npm run import:enem:2022

# Importar apenas questões de 2021
npm run import:enem:2021

# ... e assim por diante até 2009
```

### Importação Programática
```typescript
import EnemApiService from './src/services/enem-api.service';

const enemService = new EnemApiService();

// Importar todas as questões
await enemService.importAllQuestions();

// Importar por ano específico
await enemService.importByYear(2023);
```

## 📋 Estrutura dos Dados

As questões são convertidas para o formato do banco de dados `QuestionBank`:

```typescript
{
  subject: string,        // Matéria mapeada (História, Biologia, etc.)
  question: string,       // Enunciado completo da questão
  options: string[],      // Alternativas da questão
  correctAnswerIndex: number, // Índice da resposta correta
  explanation: string,    // Justificativa da resposta correta
  difficulty: 'easy' | 'medium' | 'hard', // Baseado no ano
  tags: string[]         // Códigos das habilidades do ENEM
}
```

## 🎯 Mapeamento de Matérias

| Disciplina ENEM | Matéria no Sistema |
|-----------------|-------------------|
| Ciências Humanas e suas Tecnologias | História |
| Ciências da Natureza e suas Tecnologias | Biologia |
| Linguagens, Códigos e suas Tecnologias | Português |
| Matemática e suas Tecnologias | Matemática |

## 📈 Nível de Dificuldade

- **Easy**: Questões de 2009-2012
- **Medium**: Questões de 2013-2018  
- **Hard**: Questões de 2019-2023

## ⚠️ Observações

1. **Taxa de Rate Limit**: A API do ENEM pode ter limites de requisição. O serviço inclui tratamento de erros e retry automático.

2. **Questões Duplicadas**: O sistema verifica se a questão já existe no banco antes de importar para evitar duplicatas.

3. **Progresso**: O importador mostra o progresso a cada 100 questões importadas.

4. **Logs**: Todos os erros e progresso são registrados nos logs do sistema.

## 🔧 Solução de Problemas

### Erro: "Cannot find module 'axios'"
```bash
npm install axios @types/axios
```

### Erro: Conexão com banco de dados
Verifique se as variáveis de ambiente estão configuradas corretamente e se o PostgreSQL está rodando.

### Erro: "Questões já existentes"
O sistema automaticamente pula questões duplicadas. Isso é normal ao executar o script múltiplas vezes.

## 📊 Exemplo de Saída

```
✅ Importação concluída com sucesso!
📊 Total de questões importadas: 1847
⏭️ Questões puladas (já existentes): 23

📚 Questões por matéria:
   História: 456 questões
   Matemática: 423 questões
   Português: 512 questões
   Biologia: 456 questões
```

## 🔄 Atualização Futura

Para adicionar anos novos quando forem lançados:

1. Verifique se a API do ENEM tem os novos dados
2. Adicione os scripts correspondentes no `package.json`
3. Execute a importação para o novo ano

---

**Fonte**: [API ENEM](https://enem.dev) - Dados públicos de domínio público conforme Lei nº 9.610/1998.
