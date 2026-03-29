import type { NotificationTemplate } from "@/lib/types";
import { simpleNotification } from "./simple-notification";

const DEFAULT_TEMPLATE = "simple-notification";

const registry = new Map<string, NotificationTemplate>();

function register(template: NotificationTemplate) {
  registry.set(template.name, template as NotificationTemplate);
}

// Register built-in templates
register(simpleNotification);

/**
 * Get a template by name with silent fallback to the default template.
 * This ensures clients with stale template names still work.
 */
export function getTemplate(name?: string): NotificationTemplate {
  if (name && registry.has(name)) {
    return registry.get(name)!;
  }
  return registry.get(DEFAULT_TEMPLATE)!;
}

/**
 * Check if a template name exists in the registry.
 */
export function hasTemplate(name: string): boolean {
  return registry.has(name);
}

/**
 * List all registered templates with metadata.
 */
export function listTemplates(): Array<{
  name: string;
  description: string;
  supportedChannels: string[];
  variables: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}> {
  return Array.from(registry.values()).map((t) => ({
    name: t.name,
    description: t.description,
    supportedChannels: [...t.supportedChannels],
    variables: t.variablesInfo,
  }));
}
