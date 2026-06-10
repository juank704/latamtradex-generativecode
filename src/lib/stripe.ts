import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY no esta configurado en el entorno.');
  }
  // La version de la API se delega al default del SDK instalado para evitar
  // que un literal "hardcodeado" se desincronice cuando se actualice stripe.
  stripeInstance = new Stripe(key);
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('replace_me')
  );
}
