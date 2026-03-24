import type { CollectionConfig } from 'payload'

export const aiContentCollection: CollectionConfig = {
  slug: 'ai-content',
  admin: {
    hidden: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'sourceCollection',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'sourceDocId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'markdown',
      type: 'textarea',
    },
    {
      name: 'jsonLd',
      type: 'json',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Synced', value: 'synced' },
        { label: 'Error', value: 'error' },
        { label: 'Error (Permanent)', value: 'error-permanent' },
      ],
    },
    {
      name: 'errorMessage',
      type: 'text',
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'aiMeta',
      type: 'json',
    },
    {
      name: 'parentSlug',
      type: 'text',
    },
    {
      name: 'relatedSlugs',
      type: 'json',
    },
    {
      name: 'locale',
      type: 'text',
    },
    {
      name: 'isDraft',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'lastSynced',
      type: 'date',
    },
  ],
}
