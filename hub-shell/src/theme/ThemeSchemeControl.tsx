import { SegmentedControl, useMantineColorScheme, type MantineColorScheme } from "@mantine/core";

/**
 * Переключатель темы Mantine: светлая / тёмная / как в системе (auto).
 */
export function ThemeSchemeControl(): JSX.Element {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      data-testid="theme-scheme-control"
      size="xs"
      value={colorScheme}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
      aria-label="Тема оформления"
      data={[
        { label: "Светлая", value: "light" },
        { label: "Тёмная", value: "dark" },
        { label: "Системная", value: "auto" },
      ]}
    />
  );
}
