# Integração de Webhooks - Mercado Pago

Este documento descreve a implementação da integração de webhooks do Mercado Pago para processamento automático de pagamentos e adição de créditos aos usuários.

## Visão Geral

Os webhooks permitem que o Mercado Pago notifique automaticamente nossa aplicação sobre eventos de pagamento, eliminando a necessidade de verificações constantes e melhorando a eficiência do sistema.

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_WEBHOOK_SECRET=5b4c8978487eef0dc4957b80e834e848668677763ea8bab8fcf45c7e79d1b996
```

- `MERCADOPAGO_ACCESS_TOKEN`: Token de acesso da sua aplicação no Mercado Pago
- `MERCADOPAGO_WEBHOOK_SECRET`: Chave secreta gerada pelo painel do Mercado Pago para validação de webhooks

### 2. Configuração no Painel do Mercado Pago

1. Acesse [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) no Mercado Pago
2. Selecione sua aplicação
3. Vá para **Webhooks > Configurar notificações**
4. Configure as URLs:
   - **URL modo teste**: `https://seudominio.com/api/v1/payments/webhook`
   - **URL modo produção**: `https://seudominio.com/api/v1/payments/webhook`
5. Selecione os eventos para receber notificações:
   - `payment` - Notificações de pagamentos
6. Salve para gerar a assinatura secreta

## Funcionamento

### Endpoint do Webhook

```
POST /api/payments/webhook
```

### Validação de Segurança

1. **Assinatura HMAC SHA256**: Cada webhook inclui um header `x-signature` que contém:
   - `ts`: Timestamp da notificação
   - `v1`: Hash HMAC SHA256

2. **Template de Validação**:
   ```
   id:{data.id};request-id:{x-request-id};ts:{ts};
   ```

3. **Rate Limiting**: Máximo de 100 requisições por hora por IP para prevenir abusos

### Processamento de Pagamentos

Quando um pagamento é aprovado:

1. Busca os detalhes do pagamento via API do Mercado Pago
2. Localiza o usuário usando `external_reference`
3. Calcula créditos baseado no valor pago
4. Atualiza o saldo de créditos do usuário
5. Registra todas as operações no log

### Conversão de Créditos

| Valor Pago | Créditos Adicionados | Plano |
|------------|---------------------|-------|
| ≥ R$ 49,90 | 70 créditos | Avançado |
| ≥ R$ 29,90 | 40 créditos | Premium |
| ≥ R$ 19,90 | 25 créditos | Intermediário |
| ≥ R$ 9,90 | 10 créditos | Básico |
| < R$ 9,90 | Valor em reais (mín. 1) | Personalizado |

## Logs e Monitoramento

### Logs Estruturados

Todos os eventos são registrados com winston, incluindo:
- Recebimento de notificações
- Detalhes do pagamento
- Adição de créditos
- Erros e falhas

### Monitoramento

- Verifique os logs em tempo real
- Monitore o painel de notificações no Mercado Pago
- Configure alertas para falhas consecutivas

## Tratamento de Erros

### Possíveis Cenários

1. **Assinatura Inválida**: Retorna 401
2. **Pagamento Não Encontrado**: Log de erro, continua processamento
3. **Usuário Não Encontrado**: Log de erro, falha no processamento
4. **Erro Interno**: Retorna 500, log detalhado

### Retry Automático

O Mercado Pago faz retry automático em caso de falha:
- Até 3 tentativas
- Intervalo de 15 minutos entre tentativas

## Testes

### Simulação no Painel

1. Configure uma URL de teste
2. Use a função "Simular" no painel do Mercado Pago
3. Verifique logs e atualização de créditos

### Teste Manual

```bash
curl -X POST \
  https://seudominio.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-signature: ts=1704908010,v1=618c85345248dd820d5fd456117c2ab2ef8eda45a0282ff693eac24131a5e839" \
  -H "x-request-id: test-request-123" \
  -d '{
    "id": 12345,
    "live_mode": false,
    "type": "payment",
    "date_created": "2021-11-01T02:02:02Z",
    "user_id": 1401398354,
    "api_version": "v1",
    "action": "payment.updated",
    "data": {"id": "123456"}
  }'
```

## Segurança

- **Validação de Assinatura**: Garante autenticidade das notificações
- **Rate Limiting**: Previne ataques de força bruta
- **HTTPS Obrigatório**: Webhooks devem usar HTTPS em produção
- **Logs de Segurança**: Registra tentativas suspeitas

## Troubleshooting

### Problemas Comuns

1. **Webhook não chega**:
   - Verifique se a URL está acessível publicamente
   - Confirme se está usando HTTPS em produção
   - Verifique configurações de firewall

2. **Assinatura inválida**:
   - Confirme se a chave secreta está correta
   - Verifique se o template de validação está implementado corretamente

3. **Créditos não adicionados**:
   - Verifique se `external_reference` contém o ID do usuário
   - Confirme se o usuário existe no banco de dados
   - Verifique logs para detalhes do erro

### Debug

Para debug em desenvolvimento:
```bash
# Ver logs em tempo real
tail -f logs/app.log

# Verificar estrutura do webhook
curl -X POST localhost:3001/api/v1/payments/webhook \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

## Próximos Passos

- [ ] Configurar webhooks em produção
- [ ] Testar fluxo completo de pagamento
- [ ] Implementar notificações por email para usuários
- [ ] Adicionar métricas de conversão
- [ ] Configurar alertas para falhas

---

**Nota**: Este documento deve ser atualizado sempre que houver mudanças na lógica de processamento de webhooks.