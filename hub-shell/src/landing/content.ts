/**
 * Тексты публичного B2B-лендинга (ru). Правки контента — здесь, без правок разметки.
 */

export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export type IcpColumn = {
  audience: string;
  title: string;
  bullets: string[];
};

export type CapabilityContour = {
  userMeaning: string;
  productName: string;
  description: string;
};

export type EdcBlock = {
  title: string;
  productName: string;
  description: string;
};

export type PhaseRow = {
  phase: string;
  summary: string;
};

export type ProductStatus = "available" | "pilot" | "in_development" | "roadmap";

export type StatusLegendItem = {
  key: ProductStatus;
  label: string;
};

export type ProductStatusRow = {
  product: string;
  status: ProductStatus;
  note: string;
};

export type DeliveryStage = {
  title: string;
  description: string;
  customerRoles: string[];
};

export type SecurityBullet = {
  text: string;
};

export type TransparencyBlock = {
  title: string;
  body: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Карточки блока «Экосистема April» (Simple Info Card); поля совместимы с `AprilEcosystemSimpleCards` из @april/ui */
export type EcosystemSimpleCard = {
  letter: string;
  title: string;
  product: string;
  description: string;
};

export type ContactFormCopy = {
  title: string;
  lead: string;
  fields: {
    company: string;
    country: string;
    role: string;
    scale: string;
    scaleOptions: { value: string; label: string }[];
    comment: string;
    consent: string;
  };
  submit: string;
  validationRequired: string;
};

export type FooterCopy = {
  contactsPlaceholder: string;
  legalPlaceholder: string;
  lastUpdatedLabel: string;
  lastUpdatedValue: string;
};

export type LandingContent = {
  seoTitle: string;
  seoDescription: string;
  trustLine: string;
  primaryCta: string;
  primaryCtaLoading: string;
  secondaryCta: string;
  navLogin: string;
  nav: NavItem[];
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  icpTitle: string;
  icpColumns: IcpColumn[];
  marketProblemTitle: string;
  marketPains: string[];
  marketBridge: string;
  ecosystemSectionTitle: string;
  ecosystemSectionLead: string;
  ecosystemSimpleCards: EcosystemSimpleCard[];
  mapTitle: string;
  mapLead: string;
  contours: CapabilityContour[];
  edc: EdcBlock;
  phasesTitle: string;
  phasesLead: string;
  phases: PhaseRow[];
  statusTitle: string;
  statusLegend: StatusLegendItem[];
  productStatuses: ProductStatusRow[];
  deliveryTitle: string;
  deliveryLead: string;
  deliveryStages: DeliveryStage[];
  securityTitle: string;
  securityBullets: SecurityBullet[];
  securityPoliciesNote: string;
  transparencyTitle: string;
  transparencyBlocks: TransparencyBlock[];
  faqTitle: string;
  faqItems: FaqItem[];
  finalCtaTitle: string;
  finalCtaLead: string;
  contact: ContactFormCopy;
  footer: FooterCopy;
  metaLineTemplate: string;
};

export const landingContent: LandingContent = {
  seoTitle: "April — платформа для операций, ИТ и комплаенса",
  seoDescription:
    "Публичный обзор экосистемы April: единая точка входа AprilHub, процессы AprilWorkFlow, коммуникации AprilNFlow, мастер-данные AprilOrgFlow и AprilProfile, отчёты AprilReport, внешний контур AprilEDC. Этапы внедрения, статус продуктов и вход в рабочую зону через Keycloak.",
  trustLine: "Единый ingress · Keycloak OIDC · дизайн-система April (Mantine + токены)",
  primaryCta: "Открыть рабочее пространство",
  primaryCtaLoading: "Перенаправляем в Keycloak...",
  secondaryCta: "Запросить контакт",
  navLogin: "Вход",
  nav: [
    { id: "why", label: "Зачем", href: "#why" },
    { id: "ecosystem", label: "Экосистема", href: "#ecosystem" },
    { id: "map", label: "Карта", href: "#map" },
    { id: "phases", label: "Этапы", href: "#phases" },
    { id: "status", label: "Статус", href: "#status" },
    { id: "delivery", label: "Внедрение", href: "#delivery" },
    { id: "security", label: "Безопасность", href: "#security" },
    { id: "faq", label: "FAQ", href: "#faq" },
    { id: "contact", label: "Контакты", href: "#contact" },
  ],
  heroEyebrow: "Экосистема April",
  heroTitle: "Единая платформа для бизнеса, ИТ и комплаенса",
  heroSubtitle:
    "AprilHub — точка входа в продуктовую среду: процессы, коммуникации, мастер-данные и отчётность с согласованной моделью доступа через Keycloak.",
  icpTitle: "Для кого",
  icpColumns: [
    {
      audience: "Бизнес и операции",
      title: "Сквозные процессы и прозрачность",
      bullets: [
        "Единая картина статусов и handoff между подразделениями",
        "Меньше «человеческих» согласований в почте и мессенджерах",
        "Управляемые пилоты и масштабирование по доменам",
      ],
    },
    {
      audience: "ИТ",
      title: "Интеграции без распада архитектуры",
      bullets: [
        "Согласованный ingress и сервисные границы экосистемы",
        "Наблюдаемость и корреляция запросов в одном контуре",
        "Расширение через композицию, а не копирование стеков",
      ],
    },
    {
      audience: "ИБ и комплаенс",
      title: "Контроль доступа и данных",
      bullets: [
        "RBAC из Keycloak как источник ролей",
        "Прозрачные зоны данных и внешнего контура (AprilEDC)",
        "Документы политик — по мере публикации в репозитории проекта",
      ],
    },
  ],
  marketProblemTitle: "Проблема рынка",
  marketPains: [
    "Разрозненные точки входа и дублирование учётных записей",
    "Процессы «в Excel и почте» без исполнимой модели",
    "Интеграции без единой корреляции и SLA на наблюдаемость",
    "Мастер-данные и оргструктура расходятся между системами",
  ],
  marketBridge:
    "April собирает опыт пользователя вокруг согласованных контуров и единого входа — без обхода IAM и без «отдельного портала на каждый сервис».",
  ecosystemSectionTitle: "Экосистема April",
  ecosystemSectionLead:
    "Шесть продуктовых контуров с кратким назначением; буква на карточке — мнемоника латиницей (не заменяет заголовок для чтения).",
  ecosystemSimpleCards: [
    {
      letter: "W",
      title: "Процессы",
      product: "AprilWorkFlow",
      description: "Моделирование и исполнение бизнес-процессов.",
    },
    {
      letter: "N",
      title: "Коммуникации",
      product: "AprilNFlow",
      description: "Каналы уведомлений и согласований.",
    },
    {
      letter: "O",
      title: "Структура",
      product: "AprilOrgFlow",
      description: "Оргструктура и иерархия под задачи компании.",
    },
    {
      letter: "P",
      title: "Профиль",
      product: "AprilProfile",
      description: "Профили людей, роли и контекст доступа.",
    },
    {
      letter: "I",
      title: "Интеграции",
      product: "AprilEDC",
      description: "Внешний контур данных и обмен с системами.",
    },
    {
      letter: "R",
      title: "Отчётность",
      product: "AprilReport",
      description: "Регулярная и ad-hoc отчётность по процессам и данным.",
    },
  ],
  mapTitle: "Карта возможностей платформы",
  mapLead:
    "Пять пользовательских контуров опыта и отдельный блок данных/внешнего контура. Продуктовые имена — вторая строка карточки.",
  contours: [
    {
      userMeaning: "Единая точка входа",
      productName: "AprilHub",
      description: "Гостевой лендинг и переход в авторизованную зону через тот же Keycloak OIDC flow.",
    },
    {
      userMeaning: "Процессы",
      productName: "AprilWorkFlow",
      description: "Исполнимые сценарии и согласования поверх согласованной модели сервисов.",
    },
    {
      userMeaning: "Коммуникации",
      productName: "AprilNFlow",
      description: "Каналы уведомлений и сопровождения процессов в экосистеме April.",
    },
    {
      userMeaning: "Мастер-данные (оргструктура и профили)",
      productName: "AprilOrgFlow · AprilProfile",
      description:
        "Два согласованных контура: оргструктура/иерархии и профили субъектов — чтобы не смешивать модель организации и карточку участника.",
    },
    {
      userMeaning: "Отчёты",
      productName: "AprilReport",
      description: "Сводка и аналитика по данным платформы в едином пользовательском опыте.",
    },
  ],
  edc: {
    title: "Данные и внешний контур",
    productName: "AprilEDC",
    description:
      "Обмен и сопряжение с внешними системами и данными — отдельно от пяти «опытных» контуров, чтобы не смешивать UX‑фокус и интеграционный периметр.",
  },
  phasesTitle: "Этапы развития",
  phasesLead:
    "Фазы согласованы с картой возможностей: сначала архитектура и фундамент, затем вертикальный срез, пилот и масштабирование.",
  phases: [
    { phase: "Architecture & design", summary: "Границы сервисов, интеграции, модель IAM и данных." },
    { phase: "Platform foundation", summary: "Ingress, наблюдаемость, базовые контуры AprilHub и BFF." },
    { phase: "Vertical slice", summary: "Сквозной сценарий с измеримым результатом для пилотной группы." },
    { phase: "Pilot", summary: "Ограниченный контур пользователей, обратная связь, стабилизация." },
    { phase: "Scale-out", summary: "Расширение доменов, операционные регламенты, контроль изменений." },
  ],
  statusTitle: "Текущий статус",
  statusLegend: [
    { key: "available", label: "Доступно" },
    { key: "pilot", label: "Пилот" },
    { key: "in_development", label: "В разработке" },
    { key: "roadmap", label: "По дорожной карте" },
  ],
  productStatuses: [
    { product: "AprilHub", status: "available", note: "Гостевой лендинг и вход в shell." },
    { product: "AprilWorkFlow", status: "in_development", note: "Контур процессов — по плану релизов." },
    { product: "AprilNFlow", status: "pilot", note: "Пилотные сценарии уведомлений." },
    { product: "AprilOrgFlow", status: "in_development", note: "Модель оргструктуры." },
    { product: "AprilProfile", status: "in_development", note: "Профили субъектов." },
    { product: "AprilReport", status: "roadmap", note: "Отчётность — по дорожной карте." },
    { product: "AprilEDC", status: "pilot", note: "Внешний контур данных — пилот интеграций." },
  ],
  deliveryTitle: "Как проходит проект с заказчиком",
  deliveryLead: "Этапы сопровождения и типовые роли на стороне заказчика (плейсхолдеры для уточнения в контракте).",
  deliveryStages: [
    {
      title: "Старт и границы",
      description: "Уточнение домена пилота, интеграций и критериев успеха.",
      customerRoles: ["Спонсор", "Владелец продукта", "Архитектор"],
    },
    {
      title: "Проектирование и доступы",
      description: "Модель ролей в Keycloak, среды, политики публикации.",
      customerRoles: ["ИБ", "ИТ‑лид", "Администратор домена"],
    },
    {
      title: "Пилот и приёмка",
      description: "Ограниченная группа пользователей, метрики, список доработок.",
      customerRoles: ["Бизнес‑владелец", "Операции", "Поддержка"],
    },
    {
      title: "Масштабирование",
      description: "Регламенты релизов, сопровождение, контроль изменений.",
      customerRoles: ["Сервисный менеджер", "ИТ", "ИБ"],
    },
  ],
  securityTitle: "Безопасность и данные",
  securityBullets: [
    {
      text: "Аутентификация и RBAC через Keycloak; права не дублируются произвольной логикой в обход IAM.",
    },
    {
      text: "Корреляция и наблюдаемость запросов — в рамках принятой модели эксплуатации платформы.",
    },
    {
      text: "Персональные и чувствительные данные обрабатываются согласно политикам организации; публичные документы политик появятся позже в репозитории/сайте проекта.",
    },
  ],
  securityPoliciesNote:
    "Ссылки на юридические документы добавим, когда они будут опубликованы в репозитории; сейчас раздел без мёртвых внешних URL.",
  transparencyTitle: "Прозрачность развития",
  transparencyBlocks: [
    {
      title: "Тестирование",
      body: "Стратегия уровней и smoke/e2e описаны в документации репозитория; детали релизов — в changelog по мере публикации.",
    },
    {
      title: "Релизы",
      body: "Порядок поставки на dev и обновления образов — по DEPLOYMENT_STRATEGY; конкретные номера релизов — плейсхолдер до публикации changelog.",
    },
    {
      title: "Changelog",
      body: "История изменений для внешних потребителей будет опубликована отдельно; текущий лендинг не утверждает даты релизов как обязательство.",
    },
  ],
  faqTitle: "FAQ",
  faqItems: [
    {
      question: "Как устроен вход в продукт?",
      answer:
        "Через Keycloak OIDC: с лендинга AprilHub вы переходите в поток login и возвращаетесь в авторизованную зону shell на том же ingress.",
    },
    {
      question: "Какие интеграции возможны на пилоте?",
      answer:
        "Зависят от периметра AprilEDC и согласованных контрактов; на лендинге мы не обещаем конкретные интеграции без фиксации в проектной документации.",
    },
    {
      question: "Чем отличаются AprilOrgFlow и AprilProfile?",
      answer:
        "AprilOrgFlow отвечает за оргструктуру и иерархии; AprilProfile — за профили субъектов. Это два контура, чтобы не смешивать модель организации и карточку участника.",
    },
    {
      question: "Что такое AprilEDC и почему он отдельно от «карты»?",
      answer:
        "AprilEDC — данные и внешний контур интеграций. Его выделяют отдельно, чтобы не смешивать пользовательский опыт пяти контуров и интеграционный периметр.",
    },
    {
      question: "Как проходит развёртывание на стенде?",
      answer:
        "Ориентир — docker compose и образы по git SHA, как описано в стратегии деплоя репозитория; детали среды заказчика согласуются отдельно.",
    },
    {
      question: "Есть ли обязательства по SLA и сертификации?",
      answer:
        "Публичный лендинг не утверждает SLA, сертификаты и список клиентов без подтверждения в документации репозитория; коммерческие условия — в переговорах.",
    },
  ],
  finalCtaTitle: "Готовы продолжить в продукте",
  finalCtaLead: "Войдите в рабочую зону с тем же Keycloak flow или отправьте заявку — ответим по корпоративной почте.",
  contact: {
    title: "Заявка на контакт",
    lead: "Заполните форму — откроется почтовый клиент с подготовленным текстом (MVP без backend для лидов).",
    fields: {
      company: "Компания",
      country: "Страна",
      role: "Роль",
      scale: "Масштаб",
      scaleOptions: [
        { value: "pilot", label: "Пилот (один домен)" },
        { value: "division", label: "Подразделение" },
        { value: "enterprise", label: "Предприятие / холдинг" },
        { value: "other", label: "Другое (уточню в комментарии)" },
      ],
      comment: "Комментарий",
      consent: "Согласен(на) на обработку персональных данных для ответа по заявке (опционально)",
    },
    submit: "Открыть письмо",
    validationRequired: "Укажите компанию и страну — так мы поймём контекст запроса.",
  },
  footer: {
    contactsPlaceholder: "Контакты: уточняются для публичной страницы",
    legalPlaceholder: "Юридические реквизиты: плейсхолдер",
    lastUpdatedLabel: "Последнее обновление страницы:",
    lastUpdatedValue: "2026-04-18",
  },
  metaLineTemplate: "{realm} · {clientId} · {apiBaseUrl}",
};
