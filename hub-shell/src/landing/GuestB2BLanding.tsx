import { Accordion, Box, Button, Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { AprilEcosystemSimpleCards, AprilProductHeader } from "@april/ui";
import { ProfileAccountMenu } from "../shell-header/ProfileAccountMenu";
import { useMemo } from "react";
import { landingContent } from "./content";
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

export function GuestB2BLanding({ onStartLogin, isLoginStarting, error = "", authMeta }: GuestB2BLandingProps) {
  const c = landingContent;

  const metaLine = useMemo(
    () => c.metaLineTemplate.replace("{realm}", authMeta.realm).replace("{clientId}", authMeta.clientId).replace("{apiBaseUrl}", authMeta.apiBaseUrl),
    [authMeta.apiBaseUrl, authMeta.clientId, authMeta.realm, c.metaLineTemplate],
  );

  const primaryLabel = isLoginStarting ? c.primaryCtaLoading : c.primaryCta;

  return (
    <div className="guest-landing-page" data-testid="guest-landing">
      <div className="guest-landing-header-band">
        <AprilProductHeader
          data-testid="landing-header"
          productName="AprilHub"
          center={
            <nav aria-label="Разделы лендинга" className="guest-landing-nav-links">
              {c.nav.map((item) => (
                <a key={item.id} className="guest-landing-nav-link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>
          }
          right={
            <ProfileAccountMenu
              variant="guest"
              onLogin={() => void onStartLogin()}
              isLoginStarting={isLoginStarting}
              loginLabel={c.navLogin}
            />
          }
        />
      </div>

      <main className="guest-landing-main">
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
            <Button type="button" variant="light" component="a" href={c.secondaryCtaHref}>
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

        <section
          id="ecosystem"
          className="landing-section"
          data-testid="landing-ecosystem-cards"
          aria-labelledby="ecosystem-title"
        >
          <Title order={2} id="ecosystem-title">
            {c.ecosystemSectionTitle}
          </Title>
          <Text c="dimmed">{c.ecosystemSectionLead}</Text>
          <Box mt="md">
            <AprilEcosystemSimpleCards cards={c.ecosystemSimpleCards} />
          </Box>
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
    </div>
  );
}
