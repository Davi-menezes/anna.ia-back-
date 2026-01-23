export interface PaymentNotification {
  id: string;
  live_mode: boolean;
  type: 'payment' | 'plan' | 'subscription' | 'invoice' | 'point_integration_wh';
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface PaymentData {
  id: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  transaction_amount: number;
  external_reference?: string;
  // Adicione outros campos conforme necessário
}
