import {
  Accordion,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useMemo, useState, type FormEvent } from "react";
import type { ProductStatus } from "./content";
import { landingContent } from "./content";
import { buildLeadMailto, type LeadFormValues } from "./mailto-lead";
import { SharedState } from "../shared-ux";

export type GuestB2BLandingProps = {
  onStartLogin: () => void | Promise<void>;
  isLoginStarting: boolean;
  error?: string;
  authMeta: {
    realm: string;
    clientId: string;
    apiBaseUrl: string;
  };
};

function resolveStatusLabel(status: ProductStatus): string {
  const found = landingContent.statusLegend.find((item) => item.key === status);
  return found?.label ?? status;
}

const initialForm: LeadFormValues = {
  company: "",
  country: "",
  role: "",
  scale: "pilot",
  comment: "",
  consent: false,
};

export function GuestB2BLanding({ onStartLogin, isLoginStarting, error = "", authMeta }: GuestB2BLandingProps) {
  const c = landingContent;
  const [form, setForm] = useState<LeadFormValues>(initialForm);
  const [formError, setFormError] = useState<string>("");

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const metaLine = useMemo(
    () => c.metaLineTemplate.replace("{realm}", authMeta.realm).replace("{clientId}", authMeta.clientId).replace("{apiBaseUrl}", authMeta.apiBaseUrl),
    [authMeta.apiBaseUrl, authMeta.clientId, authMeta.realm, c.metaLineTemplate],
  );

  const primaryLabel = isLoginStarting ? c.primaryCtaLoading : c.primaryCta;

  const handleLeadSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (form.company.trim().length === 0 || form.country.trim().length === 0) {
      setFormError(c.contact.validationRequired);
      return;
    }
    setFormError("");
    const url = buildLeadMailto(form);
    window.location.assign(url);
  };

  return (
    <main className="zone-container guest-landing" data-testid="guest-landing">
      <header className="guest-landing-sticky" data-testid="landing-sticky-nav">
        <Container size="lg" px={0}>
          <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
            <nav aria-label="Разделы лендинга" className="guest-landing-nav-links">
              {c.nav.map((item) => (
                <a key={item.id} className="guest-landing-nav-link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
            <Button type="button" data-testid="guest-landing-login-nav" onClick={() => void onStartLogin()} disabled={isLoginStarting}>
              {c.navLogin}
            </Button>
          </Group>
        </Container>
      </header>

      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <p className="landing-eyebrow">{c.heroEyebrow}</p>
        <Title order={1} id="landing-hero-title">
          {c.heroTitle}
        </Title>
        <Text>{c.heroSubtitle}</Text>
        <Text size="sm" c="dimmed">
          {c.trustLine}
        </Text>
        <div className="landing-actions">
          <Button type="button" data-testid="guest-landing-login-primary" onClick={() => void onStartLogin()} disabled={isLoginStarting}>
            {primaryLabel}
          </Button>
          <Button type="button" variant="light" component="a" href="#contact">
            {c.secondaryCta}
          </Button>
        </div>
      </section>

      <section id="why" className="landing-section" aria-labelledby="why-title">
        <Title order={2} id="why-title">
          {c.icpTitle}
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {c.icpColumns.map((col) => (
            <Card key={col.title} withBorder padding="lg" radius="md" className="landing-card">
              <Stack gap="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  {col.audience}
                </Text>
                <Title order={3}>{col.title}</Title>
                <Stack component="ul" gap={6} style={{ margin: 0, paddingLeft: 18 }}>
                  {col.bullets.map((b) => (
                    <Text component="li" key={b} size="sm">
                      {b}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={2} mt="xl">
          {c.marketProblemTitle}
        </Title>
        <Stack component="ul" gap="xs" style={{ margin: 0, paddingLeft: 20 }}>
          {c.marketPains.map((pain) => (
            <Text component="li" key={pain}>
              {pain}
            </Text>
          ))}
        </Stack>
        <Text mt="md">{c.marketBridge}</Text>
      </section>

      <section id="map" className="landing-section" aria-labelledby="map-title">
        <Title order={2} id="map-title">
          {c.mapTitle}
        </Title>
        <Text c="dimmed">{c.mapLead}</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="sm">
          {c.contours.map((row) => (
            <Card key={row.productName} withBorder padding="lg" radius="md" className="landing-card">
              <Stack gap={4}>
                <Text fw={700}>{row.userMeaning}</Text>
                <Text size="sm" c="dimmed">
                  {row.productName}
                </Text>
                <Text size="sm">{row.description}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Title order={3} mt="lg">
          {c.edc.title}
        </Title>
        <Card withBorder padding="lg" radius="md" mt="xs" className="landing-card">
          <Stack gap={4}>
            <Text fw={700}>{c.edc.productName}</Text>
            <Text size="sm">{c.edc.description}</Text>
          </Stack>
        </Card>
      </section>

      <section id="phases" className="landing-section" aria-labelledby="phases-title">
        <Title order={2} id="phases-title">
          {c.phasesTitle}
        </Title>
        <Text c="dimmed">{c.phasesLead}</Text>
        <Box className="landing-table-wrap" mt="sm">
          <Table.ScrollContainer minWidth={520}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Фаза</Table.Th>
                  <Table.Th>Кратко</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {c.phases.map((row) => (
                  <Table.Tr key={row.phase}>
                    <Table.Td>{row.phase}</Table.Td>
                    <Table.Td>{row.summary}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>
      </section>

      <section id="status" className="landing-section" aria-labelledby="status-title">
        <Title order={2} id="status-title">
          {c.statusTitle}
        </Title>
        <Group gap="sm" mt="xs">
          {c.statusLegend.map((item) => (
            <Text key={item.key} size="sm">
              <strong>{item.label}</strong>
            </Text>
          ))}
        </Group>
        <Box className="landing-table-wrap" mt="sm">
          <Table.ScrollContainer minWidth={560}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Продукт</Table.Th>
                  <Table.Th>Статус</Table.Th>
                  <Table.Th>Комментарий</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {c.productStatuses.map((row) => (
                  <Table.Tr key={row.product}>
                    <Table.Td>{row.product}</Table.Td>
                    <Table.Td>{resolveStatusLabel(row.status)}</Table.Td>
                    <Table.Td>{row.note}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>
      </section>

      <section id="delivery" className="landing-section" aria-labelledby="delivery-title">
        <Title order={2} id="delivery-title">
          {c.deliveryTitle}
        </Title>
        <Text c="dimmed">{c.deliveryLead}</Text>
        <Stack gap="md" mt="sm">
          {c.deliveryStages.map((stage) => (
            <Card key={stage.title} withBorder padding="md" radius="md" className="landing-card">
              <Stack gap="xs">
                <Title order={3}>{stage.title}</Title>
                <Text size="sm">{stage.description}</Text>
                <Text size="sm" fw={600}>
                  Роли заказчика
                </Text>
                <Text size="sm">{stage.customerRoles.join(", ")}</Text>
              </Stack>
            </Card>
          ))}
        </Stack>
      </section>

      <section id="security" className="landing-section" aria-labelledby="security-title">
        <Title order={2} id="security-title">
          {c.securityTitle}
        </Title>
        <Stack component="ul" gap="xs" style={{ margin: 0, paddingLeft: 20 }}>
          {c.securityBullets.map((b) => (
            <Text component="li" key={b.text}>
              {b.text}
            </Text>
          ))}
        </Stack>
        <Text size="sm" c="dimmed" mt="sm">
          {c.securityPoliciesNote}
        </Text>
      </section>

      <section id="transparency" className="landing-section" aria-labelledby="transparency-title">
        <Title order={2} id="transparency-title">
          {c.transparencyTitle}
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mt="sm">
          {c.transparencyBlocks.map((block) => (
            <Card key={block.title} withBorder padding="md" radius="md" className="landing-card">
              <Stack gap="xs">
                <Title order={3}>{block.title}</Title>
                <Text size="sm">{block.body}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </section>

      <section id="faq" className="landing-section" aria-labelledby="faq-title">
        <Title order={2} id="faq-title">
          {c.faqTitle}
        </Title>
        <Accordion variant="separated" mt="sm" data-testid="landing-faq">
          {c.faqItems.map((item, idx) => (
            <Accordion.Item value={`faq-${idx}`} key={item.question}>
              <Accordion.Control>{item.question}</Accordion.Control>
              <Accordion.Panel>
                <Text size="sm">{item.answer}</Text>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>

      <section id="contact" className="landing-section" aria-labelledby="contact-title">
        <Title order={2} id="contact-title">
          {c.finalCtaTitle}
        </Title>
        <Text c="dimmed">{c.finalCtaLead}</Text>
        <Group mt="md">
          <Button type="button" data-testid="guest-landing-login-final" onClick={() => void onStartLogin()} disabled={isLoginStarting}>
            {primaryLabel}
          </Button>
        </Group>

        <Divider my="xl" />

        <Title order={3}>{c.contact.title}</Title>
        <Text size="sm" c="dimmed" mb="md">
          {c.contact.lead}
        </Text>

        <Box component="form" onSubmit={handleLeadSubmit} className="landing-contact-form">
          <Stack gap="md">
            <TextInput
              label={c.contact.fields.company}
              required
              value={form.company}
              onChange={(e) => setField("company", e.currentTarget.value)}
            />
            <TextInput
              label={c.contact.fields.country}
              required
              value={form.country}
              onChange={(e) => setField("country", e.currentTarget.value)}
            />
            <TextInput label={c.contact.fields.role} value={form.role} onChange={(e) => setField("role", e.currentTarget.value)} />
            <Select
              label={c.contact.fields.scale}
              data={c.contact.fields.scaleOptions}
              value={form.scale}
              onChange={(v) => setField("scale", v ?? "pilot")}
            />
            <Textarea label={c.contact.fields.comment} minRows={4} value={form.comment} onChange={(e) => setField("comment", e.currentTarget.value)} />
            <Checkbox
              label={c.contact.fields.consent}
              checked={form.consent}
              onChange={(e) => setField("consent", e.currentTarget.checked)}
            />
            {formError && (
              <Text size="sm" c="red">
                {formError}
              </Text>
            )}
            <Button type="submit">{c.contact.submit}</Button>
          </Stack>
        </Box>
      </section>

      <footer className="landing-footer">
        <Stack gap={4}>
          <Text size="sm">{c.footer.contactsPlaceholder}</Text>
          <Text size="sm">{c.footer.legalPlaceholder}</Text>
          <Text size="sm" c="dimmed">
            {c.footer.lastUpdatedLabel} {c.footer.lastUpdatedValue}
          </Text>
        </Stack>
        <small className="landing-meta">{metaLine}</small>
      </footer>

      {error && <SharedState state="error" message={error} />}
    </main>
  );
}
