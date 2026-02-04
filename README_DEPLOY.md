# 🚀 Deploy Automatizado - Anna.IA Backend

Este documento explica como fazer o deploy do backend do Anna.IA com importação automática das questões do ENEM.

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- Variáveis de ambiente configuradas
- Acesso à internet (para importar questões do ENEM)

## ⚙️ Configuração de Variáveis de Ambiente

Copie o arquivo `.env.production.example` para `.env.production`:

```bash
cp .env.production.example .env.production
```

Configure as seguintes variáveis obrigatórias:

```bash
# Configurações do Servidor
NODE_ENV=production
PORT=3001
API_URL=https://seu-dominio.com
FRONTEND_URL=https://seu-dominio.com

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:porta/database

# Gemini AI
GEMINI_API_KEY=sua_gemini_api_key

# Configurações de Deploy (IMPORTANTE!)
RUN_MIGRATIONS=true
RUN_DEPLOYMENT_INIT=true
```

## 🚀 Métodos de Deploy

### Método 1: Script Automatizado (Recomendado)

Use o script `deploy.sh` para um deploy completo:

```bash
./deploy.sh
```

**O que o script faz:**
1. ✅ Verifica variáveis de ambiente
2. ✅ Instala dependências
3. ✅ Build da aplicação
4. ✅ Testa conexão com banco
5. ✅ Roda migrations automaticamente
6. ✅ Importa questões do ENEM (últimos 5 anos)
7. ✅ Verifica se as questões foram importadas

### Método 2: Deploy Manual

Se preferir fazer o deploy manualmente:

```bash
# 1. Instalar dependências
npm ci

# 2. Build da aplicação
npm run build

# 3. Rodar migrations
RUN_MIGRATIONS=true npm start

# 4. Importar questões do ENEM
npm run deploy:init

# 5. Iniciar aplicação
npm start
```

### Método 3: Docker

Para deploy com Docker:

```bash
# Build da imagem
docker build -t anna-ia-backend .

# Executar container
docker run -d \
  --name anna-ia-backend \
  -p 3001:3001 \
  --env-file .env.production \
  anna-ia-backend
```

## 📚 Importação de Questões do ENEM

### Como Funciona

O sistema importa automaticamente:

- **Fonte**: API pública [enem.dev](https://enem.dev)
- **Dados**: 2700+ questões reais (2009-2023)
- **Matérias**: Português, História, Biologia, Matemática
- **Dificuldade**: Automática baseada no ano

### Estratégia de Importação

**No primeiro deploy:**
- Importa os últimos 5 anos (2019-2023)
- Aproximadamente 250 questões
- Todas as matérias representadas

**Se já existirem questões:**
- Verifica quantidade atual
- Complementa com anos recentes se < 50 questões
- Preserva questões existentes

### Importação Manual

Se precisar importar anos específicos:

```bash
# Importar todos os anos
npm run import:enem:all

# Importar ano específico
npm run import:enem:2023
npm run import:enem:2022
# ... etc
```

## 🔄 Processo de Inicialização

### Startup Automático

Quando a aplicação inicia com `RUN_DEPLOYMENT_INIT=true`:

1. **Verifica migrations** - Roda se necessário
2. **Conta questões existentes** - Evita duplicação
3. **Importa questões** - Se banco estiver vazio ou com poucas questões
4. **Gera relatório** - Estatísticas da importação

### Logs do Deploy

Durante o deploy, você verá logs como:

```
🚀 RUN_DEPLOYMENT_INIT=true: initializing deployment...
📋 Rodando migrations do banco de dados...
✅ Migrations executadas com sucesso!
📚 0 questões encontradas. Importando questões do ENEM...
📅 Importando questões do ENEM 2023...
✅ Importação do ENEM 2023 concluída!
📊 Estatísticas das questões importadas:
📚 Total de questões: 50
   Português: 30 questões
   História: 10 questões
   Biologia: 10 questões
```

## 🎯 Simulados com Questões ENEM

### Como os Simulados Funcionam

Após a importação:

1. **Banco populado** - Questões reais disponíveis
2. **Controller atualizado** - `simulado.controller.ts` busca do `QuestionBank`
3. **Seleção aleatória** - Baseada em matéria e dificuldade
4. **Respostas oficiais** - Extraídas das questões do ENEM

### Verificação

Para verificar se os simulados estão funcionando:

```bash
# Verificar questões no banco
npm run deploy:init

# Testar endpoint de simulado
curl -X POST http://localhost:3001/api/v1/simulado/generate \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Português", "difficulty": "medium", "count": 5}'
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro: "relation question_bank does not exist"**
```bash
# Solução: Rodar migrations manualmente
RUN_MIGRATIONS=true npm start
```

**2. Erro: "Nenhuma questão encontrada"**
```bash
# Solução: Importar questões manualmente
npm run import:enem:2023
```

**3. Erro: "API ENEM indisponível"**
```bash
# Solução: Tentar novamente mais tarde
npm run deploy:init
```

**4. Erro: "Conexão com banco falhou"**
```bash
# Verificar variável DATABASE_URL
echo $DATABASE_URL
```

### Logs Detalhados

Para ver logs detalhados do deployment:

```bash
# Ver logs de importação
RUN_DEPLOYMENT_INIT=true npm start 2>&1 | grep -E "(ENEM|questões|Importação)"

# Ver logs do banco
npm start 2>&1 | grep -E "(database|migrations|question_bank)"
```

## 📊 Monitoramento

### Health Check

A aplicação inclui health check automático:

```bash
# Verificar status
curl http://localhost:3001/health

# Resposta esperada
{
  "status": "ok",
  "timestamp": "2026-02-03T23:00:00.000Z",
  "database": "connected",
  "questions": {
    "total": 100,
    "by_subject": {
      "Português": 65,
      "História": 35
    }
  }
}
```

### Métricas Importantes

Monitore estes indicadores:

- **Total de questões**: Deve ser > 50
- **Questões por matéria**: Mínimo 10 por matéria
- **Status da API ENEM**: Disponibilidade
- **Conexão com banco**: Estável

## 🔄 Atualizações Futuras

### Para Adicionar Novos Anos

Quando novos anos do ENEM forem lançados:

1. **Verificar API** - Confirme se o novo ano está disponível
2. **Adicionar script** - Crie novo comando em `package.json`
3. **Importar** - Execute o novo script
4. **Verificar** - Confirme a importação

### Exemplo para ENEM 2024:

```json
{
  "scripts": {
    "import:enem:2024": "ts-node src/services/enem-api.service.ts --year=2024"
  }
}
```

```bash
npm run import:enem:2024
```

## 🎉 Conclusão

Após seguir estes passos:

- ✅ **Deploy automatizado** com zero downtime
- ✅ **Questões ENEM reais** importadas automaticamente  
- ✅ **Simulados funcionando** com conteúdo autêntico
- ✅ **Monitoramento ativo** da saúde do sistema
- ✅ **Atualizações futuras** facilitadas

Seu sistema Anna.IA está pronto para produção com questões reais do ENEM!
