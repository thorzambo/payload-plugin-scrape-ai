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
      type: 'array',
      defaultValue: [],
      fields: [
        { name: 'slug', type: 'text', required: true },
        { name: 'section', type: 'text', required: true },
        { name: 'optional', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'llmsTxtSections',
      type: 'array',
      defaultValue: [],
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
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
