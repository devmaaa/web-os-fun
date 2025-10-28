export interface PaymentAdapter {
  processPayment(amount: number, method: string): Promise<boolean>;
}

export class StripeAdapter implements PaymentAdapter {
  async processPayment(amount: number, method: string): Promise<boolean> {
    // Integrate with Stripe
    console.log(`Processing ${amount} via ${method}`);
    return true;
  }
}

export const paymentAdapter = new StripeAdapter();