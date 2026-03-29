import { listTemplates } from "@/lib/templates";

export async function handleListTemplates() {
  const templates = listTemplates();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(templates, null, 2),
      },
    ],
  };
}
