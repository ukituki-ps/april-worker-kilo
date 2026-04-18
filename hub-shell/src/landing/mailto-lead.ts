export type LeadFormValues = {
  company: string;
  country: string;
  role: string;
  scale: string;
  comment: string;
  consent: boolean;
};

const defaultSubject = "Заявка с лендинга AprilHub (B2B)";

function resolveInquiryAddress(): string {
  const raw = import.meta.env.VITE_LANDING_INQUIRY_EMAIL;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  return "";
}

/**
 * Собирает mailto: для отправки заявки без backend (MVP).
 * Если VITE_LANDING_INQUIRY_EMAIL не задан — используется mailto: без явного адреса (клиент подставит получателя).
 */
export function buildLeadMailto(values: LeadFormValues): string {
  const to = resolveInquiryAddress();
  const lines = [
    "Заявка с публичного лендинга AprilHub",
    "",
    `Компания: ${values.company}`,
    `Страна: ${values.country}`,
    `Роль: ${values.role}`,
    `Масштаб: ${values.scale}`,
    `Согласие на обработку ПДн: ${values.consent ? "да" : "нет"}`,
    "",
    "Комментарий:",
    values.comment,
  ];
  const body = lines.join("\n");
  const query = new URLSearchParams({
    subject: defaultSubject,
    body,
  });
  const prefix = to.length > 0 ? `mailto:${encodeURIComponent(to)}` : "mailto:";
  return `${prefix}?${query.toString()}`;
}
