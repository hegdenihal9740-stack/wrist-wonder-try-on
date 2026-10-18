import { STORE_CONTACT } from '@/lib/store-info';

/** Opens a WhatsApp chat with the store, with the message pre-typed. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${STORE_CONTACT.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
