/**
 * Тексты публичного B2B-лендинга (ru). Правки контента — здесь, без правок разметки.
 */

export type IcpColumn = {
  audience: string;
  title: string;
  bullets: string[];
};

export type SecurityBullet = {
  text: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Цвет бейджа статуса на карточке — как в витрине DS (Semantic Colors: gray / blue). */
export type EcosystemStatusBadgeColor = "gray" | "blue";

/** Карточки блока «Экосистема April» (Simple Info Card + Badge). */
export type EcosystemSimpleCard = {
  letter: string;
  title: string;
  product: string;
  description: string;
  statusBadgeLabel: string;
  statusBadgeColor: EcosystemStatusBadgeColor;
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
  navLogin: string;
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
  securityTitle: string;
  securityBullets: SecurityBullet[];
  securityPoliciesNote: string;
  faqTitle: string;
  faqItems: FaqItem[];
  footer: FooterCopy;
  metaLineTemplate: string;
};

export const landingContent: LandingContent = {
  seoTitle: "April — экосистема инструментов управления компанией",
  seoDescription:
    "Публичный обзор экосистемы April: AprilHub, контуры AprilWorkFlow, AprilNFlow, AprilOrgFlow, AprilProfile, AprilReport, AprilEDC. Вход в рабочую зону через Keycloak.",
  navLogin: "Вход",
  heroEyebrow: "Экосистема April",
  heroTitle: "Экосистема инструментов управления компанией:",
  heroSubtitle:
    "процессы, коммуникации, структура, люди и документы, интеграции, отчётность.",
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
    "Шесть продуктовых контуров; справа от названия — статус в формате бейджей дизайн-системы (Plan / In Progress).",
  ecosystemSimpleCards: [
    {
      letter: "W",
      title: "Процессы",
      product: "AprilWorkFlow",
      description: "Моделирование и исполнение бизнес-процессов.",
      statusBadgeLabel: "Plan",
      statusBadgeColor: "gray",
    },
    {
      letter: "N",
      title: "Коммуникации",
      product: "AprilNFlow",
      description: "Каналы уведомлений и согласований.",
      statusBadgeLabel: "Plan",
      statusBadgeColor: "gray",
    },
    {
      letter: "O",
      title: "Структура",
      product: "AprilOrgFlow",
      description: "Оргструктура и иерархия под задачи компании.",
      statusBadgeLabel: "Plan",
      statusBadgeColor: "gray",
    },
    {
      letter: "P",
      title: "Профиль",
      product: "AprilProfile",
      description: "Профили людей, роли и контекст доступа.",
      statusBadgeLabel: "In Progress",
      statusBadgeColor: "blue",
    },
    {
      letter: "I",
      title: "Интеграции",
      product: "AprilEDC",
      description: "Внешний контур данных и обмен с системами.",
      statusBadgeLabel: "Plan",
      statusBadgeColor: "gray",
    },
    {
      letter: "R",
      title: "Отчётность",
      product: "AprilReport",
      description: "Регулярная и ad-hoc отчётность по процессам и данным.",
      statusBadgeLabel: "Plan",
      statusBadgeColor: "gray",
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
  footer: {
    contactsPlaceholder: "Контакты: уточняются для публичной страницы",
    legalPlaceholder: "Юридические реквизиты: плейсхолдер",
    lastUpdatedLabel: "Последнее обновление страницы:",
    lastUpdatedValue: "2026-04-19",
  },
  metaLineTemplate: "{realm} · {clientId} · {apiBaseUrl}",
};
