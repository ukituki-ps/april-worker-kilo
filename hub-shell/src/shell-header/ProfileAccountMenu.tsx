import { Avatar, Box, Group, Menu, Text, useMantineColorScheme, type MantineColorScheme } from "@mantine/core";
import { useDensity } from "@april/ui";
import { IconCheck, IconChevronDown, IconLogOut, IconUser } from "../icons/shell-icons";

export type ProfileAccountMenuProps =
  | {
      variant: "guest";
      onLogin: () => void;
      isLoginStarting: boolean;
      loginLabel: string;
    }
  | {
      variant: "user";
      userName: string;
      userEmail: string;
      onProfile?: () => void;
      onLogout?: () => void;
    }
  | {
      variant: "limited";
      caption: string;
      subtitle?: string;
      onLogout?: () => void;
    };

function ThemeMenuItems(): JSX.Element {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const item = (value: MantineColorScheme, label: string): JSX.Element => (
    <Menu.Item
      key={value}
      onClick={() => setColorScheme(value)}
      rightSection={colorScheme === value ? <IconCheck size={14} /> : <Box w={14} />}
    >
      {label}
    </Menu.Item>
  );

  return (
    <>
      <Menu.Label>Тема оформления</Menu.Label>
      {item("light", "Светлая")}
      {item("dark", "Тёмная")}
      {item("auto", "Системная")}
    </>
  );
}

/**
 * Меню профиля в стиле витрины дизайн-системы (аватар + chevron): тема, вход/профиль/выход.
 */
export function ProfileAccountMenu(props: ProfileAccountMenuProps): JSX.Element {
  const { density } = useDensity();
  const isCompact = density === "compact";
  const avatarSize = isCompact ? "sm" : "md";

  const target = (params: { primary: string; secondary?: string; showPlaceholderAvatar: boolean }): JSX.Element => (
    <Menu.Target>
      <Group gap={6} wrap="nowrap" style={{ cursor: "pointer" }} ml={4} aria-label="Меню профиля и настроек">
        {params.showPlaceholderAvatar ? (
          <Avatar radius="xl" size={avatarSize} color="teal" variant="light">
            <IconUser size={isCompact ? 16 : 18} />
          </Avatar>
        ) : (
          <Avatar radius="xl" size={avatarSize} color="teal">
            {params.primary.charAt(0).toUpperCase()}
          </Avatar>
        )}
        <Box style={{ lineHeight: 1 }} visibleFrom="sm">
          <Text size="xs" fw={500} lineClamp={1}>
            {params.primary}
          </Text>
          {params.secondary ? (
            <Text size="xs" c="dimmed" lineClamp={1}>
              {params.secondary}
            </Text>
          ) : null}
        </Box>
        <IconChevronDown size={14} style={{ color: "var(--mantine-color-dimmed)", flexShrink: 0 }} />
      </Group>
    </Menu.Target>
  );

  const menu = (inner: JSX.Element): JSX.Element => (
    <Box data-testid="theme-scheme-control" style={{ flexShrink: 0 }}>
      <Menu shadow="md" width={260} position="bottom-end">
        {inner}
      </Menu>
    </Box>
  );

  if (props.variant === "guest") {
    return menu(
      <>
        {target({
          primary: "Гость",
          secondary: "Не авторизован",
          showPlaceholderAvatar: true,
        })}
        <Menu.Dropdown>
          <ThemeMenuItems />
          <Menu.Divider />
          <Menu.Item
            data-testid="guest-landing-login-nav"
            disabled={props.isLoginStarting}
            onClick={() => void props.onLogin()}
            leftSection={<IconUser size={14} />}
          >
            {props.loginLabel}
          </Menu.Item>
        </Menu.Dropdown>
      </>,
    );
  }

  if (props.variant === "limited") {
    return menu(
      <>
        {target({
          primary: props.caption,
          secondary: props.subtitle,
          showPlaceholderAvatar: true,
        })}
        <Menu.Dropdown>
          <ThemeMenuItems />
          {props.onLogout ? (
            <>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogOut size={14} />} onClick={() => void props.onLogout?.()}>
                Выйти
              </Menu.Item>
            </>
          ) : null}
        </Menu.Dropdown>
      </>,
    );
  }

  const primary = props.userName.trim() || props.userEmail.trim() || "Пользователь";
  const secondary = props.userName.trim().length > 0 ? props.userEmail : undefined;

  return menu(
    <>
      {target({
        primary,
        secondary,
        showPlaceholderAvatar: false,
      })}
      <Menu.Dropdown>
        <ThemeMenuItems />
        <Menu.Divider />
        {props.onProfile ? (
          <Menu.Item data-testid="shell-profile-open" leftSection={<IconUser size={14} />} onClick={() => props.onProfile?.()}>
            Профиль
          </Menu.Item>
        ) : null}
        {props.onLogout ? (
          <Menu.Item color="red" leftSection={<IconLogOut size={14} />} onClick={() => void props.onLogout?.()}>
            Выйти
          </Menu.Item>
        ) : null}
      </Menu.Dropdown>
    </>,
  );
}
