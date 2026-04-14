workspace "April Service" "C4-модель экосистемы April c микрофронтами и независимыми backend-сервисами." {

    model {
        employee = person "Сотрудник" "Основной пользователь рабочего места April."
        admin = person "Администратор" "Администрирование, поддержка и эксплуатация."

        keycloak = softwareSystem "Keycloak" "Встроенный IAM-контур April: OIDC/OAuth2, роли и права." {
            tags "April"
        }
        hris = softwareSystem "HRIS / кадровые системы" "Внешние HR-источники и кадровый контур." {
            tags "External"
        }
        ad = softwareSystem "Active Directory" "Корпоративный каталог пользователей и групп." {
            tags "External"
        }
        jobPortals = softwareSystem "Внешние порталы" "HH, LinkedIn, Фабрикант и другие источники вакансий/резюме." {
            tags "External"
        }

        nginx = softwareSystem "Nginx Reverse Proxy" "Входной reverse proxy для frontend/API маршрутизации." {
            tags "Infrastructure"
        }
        redis = softwareSystem "Redis + Asynq" "Очереди фоновых задач и отложенная обработка." {
            tags "Infrastructure"
        }
        pg = softwareSystem "PostgreSQL 17" "Операционное хранение данных сервисов." {
            tags "Infrastructure"
        }

        aprilHub = softwareSystem "AprilHub" "Рабочее место сотрудника и единая точка входа. Контейнер-оркестратор микрофронтов." {
            tags "April"

            hubShell = container "Hub Shell (Microfrontend Orchestrator)" "React/Vite контейнер, динамически загружает и размещает микрофронты сервисов." "TypeScript, React, Vite" {
                shellRouter = component "Shell Router" "Маршрутизация и composition UI-модулей." "React Router"
                mfeRegistry = component "MFE Registry & Loader" "Реестр и динамическая загрузка микрофронтов." "TypeScript"
                sessionClient = component "Session Client" "Клиентская работа с OIDC сессией и refresh токенов." "OIDC client"
                navigationUi = component "Navigation UI" "Глобальная навигация и layout рабочего места." "React"
            }
            hubBff = container "Hub BFF API" "BFF-слой для агрегированных сценариев рабочего места." "Go, REST" {
                bffHttp = component "BFF HTTP API" "REST-эндпоинты, агрегирующие данные для Hub UI." "Go, net/http"
                bffAuth = component "Auth Middleware" "Проверка JWT/OIDC токенов и RBAC-прав." "Go"
                bffAggregator = component "Aggregation Service" "Композиция данных из доменных сервисов." "Go"
                bffAdapter = component "Domain API Adapter" "Клиенты к API доменных сервисов." "Go HTTP clients"
            }
        }

        aprilWorkflow = softwareSystem "AprilWorkFlow" "Конструирование, исполнение и мониторинг бизнес-процессов (без BPMN)." {
            tags "April"

            workflowWidget = container "WorkflowWidget" "Микрофронт управления и мониторинга процессов." "TypeScript, React"
            workflowApi = container "Workflow API" "REST API и orchestration для workflow-домена." "Go, REST"
            workflowWorker = container "Workflow Worker" "Temporal workers для выполнения шагов процесса." "Go, Temporal SDK"
            workflowTemporal = container "Temporal Cluster" "Встроенный кластер Temporal для оркестрации workflow-процессов." "Temporal"
        }

        aprilNflow = softwareSystem "AprilNFlow" "Унифицированная отправка сообщений по разным каналам." {
            tags "April"

            nflowWidget = container "NFlowWidget" "Микрофронт конфигурации шаблонов и правил отправки." "TypeScript, React"
            nflowApi = container "NFlow API" "Единый API отправки и автоматизации сообщений." "Go, REST"
            nflowWorker = container "NFlow Worker" "Фоновая обработка доставки, ретраи и обработка ошибок каналов." "Go, Asynq"
        }

        aprilOrgFlow = softwareSystem "AprilOrgFlow" "Версионируемое хранилище оргструктуры и ролевых связей." {
            tags "April"

            orgWidget = container "OrgChartWidget" "Микрофронт визуализации и редактирования оргструктуры." "TypeScript, React"
            orgApi = container "OrgFlow API" "REST API оргструктуры для внутренних систем." "Go, REST"
            orgWorker = container "OrgFlow Worker" "Фоновая синхронизация и пересчёт иерархий оргструктуры." "Go, Asynq"
        }

        aprilProfil = softwareSystem "AprilProfil" "Версионируемые профили сотрудников/подразделений/должностей с аудитом." {
            tags "April"

            profileWidget = container "ProfileWidget" "Микрофронт работы с профилями и версиями." "TypeScript, React"
            profileApi = container "Profil API" "REST API профилей, версионирование и аудит изменений." "Go, REST"
            profileWorker = container "Profil Worker" "Фоновые задачи обогащения профилей и синхронизации атрибутов." "Go, Asynq"
        }

        aprilEdc = softwareSystem "AprilEDC" "Коннектор внешних кадровых и рыночных данных (External Data Connector)." {
            tags "April"

            edcWidget = container "EDCWidget" "Микрофронт мониторинга и ручного запуска интеграций." "TypeScript, React"
            edcAdmin = container "EDC Admin UI" "Админка управления адаптерами, маппингами и расписанием синхронизаций." "TypeScript, React"
            edcApi = container "EDC API / Scheduler" "Управление адаптерами, расписанием, нормализацией и ретраями." "Go, REST"
            edcWorker = container "EDC Worker" "Фоновая загрузка данных из внешних источников и нормализация." "Go, Asynq"
        }

        aprilReport = softwareSystem "AprilReport" "Платформа аналитики, отчётов и дашбордов по данным экосистемы." {
            tags "April"

            reportWidget = container "ReportWidget" "Микрофронт отчётов и аналитических дашбордов." "TypeScript, React"
            reportApi = container "Report API" "REST API аналитики, предрасчётов и выгрузок." "Go, REST"
            reportWorker = container "Report Worker" "Фоновые предрасчёты и материализация отчётных агрегатов." "Go, Asynq"
        }

        aprilWorker = softwareSystem "AprilWorker" "Централизованный сервис исполнения бизнес-логики и сквозных сценариев между доменами." {
            tags "April"

            aprilWorkerApi = container "AprilWorker API" "Единая точка запуска кросс-доменных бизнес-сценариев." "Go, REST" {
                workerHttp = component "Worker HTTP API" "REST-endpoints запуска бизнес-сценариев." "Go, net/http"
                scenarioOrchestrator = component "Scenario Orchestrator" "Координация синхронных шагов межсервисного сценария." "Go"
                policyEngine = component "Policy Engine" "Вычисление правил, ветвлений и precondition-проверок." "Go"
                serviceGateway = component "Service Gateway" "Клиентские адаптеры к AprilWorkFlow/NFlow/OrgFlow/Profil/Report/EDC." "Go HTTP clients"
            }
            aprilWorkerEngine = container "AprilWorker Engine" "Исполнитель бизнес-правил, оркестрации и компенсаций." "Go, Asynq" {
                taskConsumer = component "Task Consumer" "Обработчик асинхронных задач и ретраев." "Asynq consumer"
                compensationManager = component "Compensation Manager" "Выполнение компенсирующих действий при сбоях шага." "Go"
                stateStore = component "Execution State Store" "Хранение прогресса сценариев и статусов шагов." "PostgreSQL repository"
                idempotencyGuard = component "Idempotency Guard" "Защита от повторной обработки по ключам идемпотентности." "Redis/PostgreSQL"
            }
        }

        employee -> nginx "Открывает рабочее место через браузер"
        admin -> nginx "Входит в систему через браузер"
        nginx -> hubShell "Отдаёт frontend AprilHub"
        nginx -> hubBff "Проксирует API-запросы BFF"
        nginx -> keycloak "Проксирует страницу и endpoints авторизации"

        employee -> hubShell "Работает в единой точке входа"
        employee -> keycloak "Проходит авторизацию на Keycloak Login UI"
        admin -> keycloak "Проходит авторизацию на Keycloak Login UI"
        admin -> hubBff "Администрирует рабочее место (через Nginx)"
        hubShell -> keycloak "Аутентификация (OIDC)"
        hubBff -> keycloak "Проверка токенов и ролей"
        shellRouter -> mfeRegistry "Разрешает микрофронт по маршруту"
        mfeRegistry -> sessionClient "Передаёт auth context загруженным микрофронтам"
        sessionClient -> keycloak "Обновляет сессию и валидирует токен"
        navigationUi -> shellRouter "Переключает рабочие разделы"
        bffHttp -> bffAuth "Проверяет доступ к endpoint"
        bffHttp -> bffAggregator "Запрашивает агрегированный ответ"
        bffAggregator -> bffAdapter "Вызывает доменные API"

        hubShell -> workflowWidget "Встраивает микрофронт процесса"
        hubShell -> nflowWidget "Встраивает микрофронт уведомлений"
        hubShell -> orgWidget "Встраивает микрофронт оргструктуры"
        hubShell -> profileWidget "Встраивает микрофронт профилей"
        hubShell -> edcWidget "Встраивает микрофронт интеграций"
        hubShell -> reportWidget "Встраивает микрофронт отчётов"

        workflowWidget -> workflowApi "Работает с API напрямую"
        nflowWidget -> nflowApi "Работает с API напрямую"
        orgWidget -> orgApi "Работает с API напрямую"
        profileWidget -> profileApi "Работает с API напрямую"
        edcWidget -> edcApi "Работает с API напрямую"
        edcAdmin -> edcApi "Администрирует адаптеры через API"
        reportWidget -> reportApi "Работает с API напрямую"

        workflowApi -> workflowTemporal "Регистрирует/читает workflow"
        workflowWorker -> workflowTemporal "Исполняет workflow задачи"
        workflowApi -> pg "Хранит состояния процессов"
        nflowApi -> redis "Ставит фоновые задачи доставки"
        nflowWorker -> redis "Забирает и исполняет задачи"
        nflowApi -> pg "Хранит шаблоны и историю"
        nflowWorker -> pg "Обновляет статусы и логи доставки"
        orgApi -> redis "Ставит задачи синхронизации оргструктуры"
        orgWorker -> redis "Забирает и исполняет задачи"
        orgApi -> pg "Хранит версии оргструктуры"
        orgWorker -> pg "Применяет фоновые изменения и пересчёты"
        profileApi -> redis "Ставит задачи синхронизации профилей"
        profileWorker -> redis "Забирает и исполняет задачи"
        profileApi -> pg "Хранит версии профилей"
        profileWorker -> pg "Обновляет данные профилей и аудит"
        reportApi -> redis "Ставит задачи предрасчётов отчётов"
        reportWorker -> redis "Забирает и исполняет задачи"
        reportApi -> pg "Читает/материализует аналитические данные"
        reportWorker -> pg "Материализует агрегаты и кэши"
        edcApi -> redis "Ставит задачи загрузки и нормализации"
        edcWorker -> redis "Забирает и исполняет задачи"
        edcApi -> pg "Кэширует и нормализует входящие данные"
        edcWorker -> pg "Сохраняет результаты синхронизации"
        edcWorker -> jobPortals "Забирает вакансии/резюме/компании"
        orgApi -> hris "Синхронизирует оргданные"
        profileApi -> hris "Синхронизирует кадровые профили"
        profileApi -> ad "Сверяет доступы и служебные атрибуты"

        workflowApi -> profileApi "Читает профили участников процесса" "REST" "Sync"
        workflowApi -> orgApi "Читает оргконтекст и роли согласования" "REST" "Sync"
        workflowWorker -> nflowApi "Инициирует уведомления по этапам процесса" "REST" "Sync"

        nflowApi -> profileApi "Получает контактные и ролевые данные получателей" "REST" "Sync"
        nflowApi -> orgApi "Получает руководителя по оргструктуре для эскалаций" "REST" "Sync"
        nflowApi -> workflowApi "Получает инициатора процесса для уведомлений" "REST" "Sync"

        reportApi -> profileApi "Читает кадровые справочники для срезов" "REST" "Sync"
        reportApi -> orgApi "Читает оргиерархию для агрегирования" "REST" "Sync"
        reportWorker -> workflowApi "Забирает метрики исполнения процессов" "REST" "Sync"
        reportWorker -> nflowApi "Забирает статусы коммуникаций" "REST" "Sync"

        edcWorker -> profileApi "Публикует обновления профилей после нормализации" "Event/API" "Async"
        edcWorker -> orgApi "Публикует обновления оргданных после нормализации" "Event/API" "Async"
        workflowApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"
        nflowApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"
        orgApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"
        profileApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"
        reportApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"
        aprilWorkerApi -> edcApi "Запускает интеграционную задачу по бизнес-логике" "REST" "Sync"

        edcWorker -> workflowApi "Возвращает результат интеграционной обработки" "Event/API" "Async"
        edcWorker -> nflowApi "Возвращает результат интеграционной обработки" "Event/API" "Async"
        edcWorker -> reportApi "Возвращает результат интеграционной обработки" "Event/API" "Async"

        aprilWorkerApi -> workflowApi "Запускает и координирует workflow-сценарии" "REST" "Sync"
        aprilWorkerApi -> nflowApi "Инициирует коммуникации по бизнес-правилам" "REST" "Sync"
        aprilWorkerApi -> orgApi "Читает оргконтекст для правил и маршрутов" "REST" "Sync"
        aprilWorkerApi -> profileApi "Читает профильные атрибуты участников" "REST" "Sync"
        aprilWorkerApi -> reportApi "Запускает обновление отчётных срезов" "REST" "Sync"
        aprilWorkerEngine -> redis "Исполняет фоновые бизнес-задачи и компенсации"
        aprilWorkerEngine -> pg "Хранит состояние выполнения бизнес-сценариев"
        workerHttp -> scenarioOrchestrator "Передаёт команду запуска сценария"
        scenarioOrchestrator -> policyEngine "Проверяет правила и ограничения"
        scenarioOrchestrator -> serviceGateway "Исполняет межсервисные шаги"
        scenarioOrchestrator -> taskConsumer "Планирует async продолжения"
        taskConsumer -> compensationManager "Активирует компенсацию при ошибках"
        taskConsumer -> stateStore "Фиксирует статус шага и сценария"
        taskConsumer -> idempotencyGuard "Проверяет повторную доставку задач"

        deploymentEnvironment "Development" {
            deploymentNode "dev-host" "Debian 13 VM (dev)" "Virtual machine" {
                deploymentNode "nginx" "Reverse proxy" "Nginx" {
                    containerInstance hubShell
                }

                deploymentNode "aprilhub-runtime" "Hub backend runtime" "Docker" {
                    containerInstance hubBff
                }

                deploymentNode "aprilworker-runtime" "Worker service runtime" "Docker" {
                    containerInstance aprilWorkerApi
                    containerInstance aprilWorkerEngine
                }
            }

            deploymentNode "dev-data" "Data services" "Docker" {
                softwareSystemInstance pg
                softwareSystemInstance redis
            }
        }
    }

    views {
        systemLandscape "Landscape" {
            include *
            autolayout tb 300 220
        }

        systemContext aprilHub "AprilHubContext" {
            include *
            autolayout lr
        }

        container aprilHub "AprilHubContainers" {
            include *
            autolayout lr
        }

        container aprilWorkflow "AprilWorkflowContainers" {
            include *
            autolayout lr
        }

        container aprilNflow "AprilNflowContainers" {
            include *
            autolayout lr
        }

        container aprilOrgFlow "AprilOrgFlowContainers" {
            include *
            autolayout lr
        }

        container aprilProfil "AprilProfilContainers" {
            include *
            autolayout lr
        }

        container aprilReport "AprilReportContainers" {
            include *
            autolayout lr
        }

        container aprilEdc "AprilEdcContainers" {
            include *
            autolayout lr
        }

        container aprilWorker "AprilWorkerContainers" {
            include *
            autolayout lr
        }

        component hubShell "AprilHubShellComponents" {
            include *
            autolayout lr
        }

        component hubBff "AprilHubBffComponents" {
            include *
            autolayout lr
        }

        component aprilWorkerApi "AprilWorkerApiComponents" {
            include *
            autolayout lr
        }

        component aprilWorkerEngine "AprilWorkerEngineComponents" {
            include *
            autolayout lr
        }

        deployment aprilHub "Development" "AprilHubDeploymentDev" {
            include *
            autolayout lr
        }

        deployment aprilWorker "Development" "AprilWorkerDeploymentDev" {
            include *
            autolayout lr
        }

        styles {
            element "Element" {
                color #1168bd
            }
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }
            element "Software System" {
                background #1168bd
                color #ffffff
            }
            element "Container" {
                background #438dd5
                color #ffffff
            }
            element "External" {
                background #999999
                color #ffffff
            }
            element "Infrastructure" {
                background #5c6b73
                color #ffffff
            }
            element "April" {
                background #0b60b0
                color #ffffff
            }
            relationship "Sync" {
                color #2e7d32
                dashed false
                thickness 3
            }
            relationship "Async" {
                color #ef6c00
                dashed true
                thickness 3
            }
        }

        theme default
    }

}
