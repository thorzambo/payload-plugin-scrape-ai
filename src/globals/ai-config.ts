import type { GlobalConfig } from 'payload'

export const aiConfigGlobal: GlobalConfig = {
  slug: 'ai-config',
  admin: {
    hidden: true,
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'enabledCollections',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'aiEnabled',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'aiProvider',
      type: 'select',
      options: [
        { label: 'OpenAI', value: 'openai' },
        { label: 'Anthropic', value: 'anthropic' },
      ],
    },
    {
      name: 'aiModel',
      type: 'text',
    },
    {
      name: 'llmsTxtPriority',
      type: 'json',
      defaultValue: [],
    },
    {
      name: 'llmsTxtSections',
      type: 'json',
      defaultValue: [
        { name: 'pages', label: 'Pages' },
        { name: 'posts', label: 'Blog' },
      ],
    },
    {
      name: 'aiApiCallCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'aiApiCallCountResetDate',
      type: 'date',
    },
    {
      name: 'lastAggregateRebuild',
      type: 'date',
    },
  ],
}
