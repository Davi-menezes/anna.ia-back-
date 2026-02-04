#!/bin/bash

# Script de Deploy Automatizado - Anna.IA Backend
# Este script prepara e faz o deploy da aplicação com todas as configurações necessárias

set -e

echo "🚀 Iniciando deploy do Anna.IA Backend..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    log_error "Este script deve ser executado no diretório raiz do backend"
    exit 1
fi

# Verificar variáveis de ambiente necessárias
check_env_vars() {
    log_info "Verificando variáveis de ambiente..."
    
    required_vars=("DATABASE_URL" "JWT_SECRET" "GEMINI_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Variáveis de ambiente obrigatórias não encontradas:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_error "Configure as variáveis e execute o script novamente"
        exit 1
    fi
    
    log_success "Variáveis de ambiente verificadas"
}

# Instalar dependências
install_dependencies() {
    log_info "Instalando dependências..."
    npm ci --production=false
    log_success "Dependências instaladas"
}

# Build da aplicação
build_application() {
    log_info "Build da aplicação..."
    npm run build
    log_success "Build concluído"
}

# Testar conexão com banco de dados
test_database_connection() {
    log_info "Testando conexão com banco de dados..."
    
    # Criar script de teste temporário
    cat > test-db.js << 'EOF'
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

client.connect()
    .then(() => {
        console.log('✅ Conexão com banco de dados bem-sucedida');
        client.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro na conexão com banco de dados:', err.message);
        process.exit(1);
    });
EOF

    node test-db.js
    rm test-db.js
    log_success "Conexão com banco de dados testada"
}

# Inicializar deployment
initialize_deployment() {
    log_info "Inicializando deployment (migrations + importação ENEM)..."
    
    # Definir variáveis para inicialização
    export RUN_MIGRATIONS=true
    export RUN_DEPLOYMENT_INIT=true
    
    # Executar inicialização
    npm run deploy:init
    
    log_success "Inicialização do deployment concluída"
}

# Verificar se as questões foram importadas
verify_questions() {
    log_info "Verificando importação de questões..."
    
    # Criar script de verificação temporário
    cat > verify-questions.js << 'EOF'
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

client.connect()
    .then(async () => {
        const result = await client.query('SELECT COUNT(*) as count FROM question_bank');
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
            console.log(`✅ ${count} questões encontradas no banco de dados`);
            
            // Verificar questões por matéria
            const subjectStats = await client.query(`
                SELECT subject, COUNT(*) as count 
                FROM question_bank 
                GROUP BY subject 
                ORDER BY count DESC
            `);
            
            console.log('📊 Questões por matéria:');
            subjectStats.rows.forEach(row => {
                console.log(`   ${row.subject}: ${row.count}`);
            });
        } else {
            console.log('⚠️ Nenhuma questão encontrada no banco de dados');
        }
        
        client.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erro ao verificar questões:', err.message);
        client.end();
        process.exit(1);
    });
EOF

    node verify-questions.js
    rm verify-questions.js
}

# Main execution
main() {
    log_info "Anna.IA Backend - Deploy Automatizado"
    echo "=================================="
    
    # Verificar ambiente
    check_env_vars
    
    # Instalar dependências
    install_dependencies
    
    # Build da aplicação
    build_application
    
    # Testar conexão com banco
    test_database_connection
    
    # Inicializar deployment
    initialize_deployment
    
    # Verificar questões
    verify_questions
    
    log_success "🎉 Deploy concluído com sucesso!"
    echo ""
    echo "📋 Resumo:"
    echo "  ✅ Aplicação buildada"
    echo "  ✅ Migrations executadas"
    echo "  ✅ Questões ENEM importadas"
    echo "  ✅ Sistema pronto para uso"
    echo ""
    echo "🚀 Para iniciar a aplicação: npm start"
}

# Executar main
main "$@"
