export default {
  name: 'brand',
  title: 'Marque',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'brandKey',
      title: 'Clé de marque',
      description: 'Doit correspondre exactement au champ "Marque" dans les produits (ex: "Cassina")',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'country',
      title: 'Pays',
      type: 'string',
    },
    {
      name: 'city',
      title: 'Ville',
      type: 'string',
    },
    {
      name: 'founded',
      title: 'Année de fondation',
      type: 'number',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 5,
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'coverImage',
      title: 'Image de couverture',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'website',
      title: 'Site web (sans https://)',
      type: 'string',
      placeholder: 'cassina.com',
    },
    {
      name: 'color',
      title: 'Couleur de fond (hex)',
      type: 'string',
      placeholder: '#e8e0d5',
    },
    {
      name: 'featured',
      title: 'Mise en avant',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      initialValue: 99,
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'country', media: 'logo' },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: subtitle || '', media };
    },
  },
  orderings: [
    { title: 'Ordre d\'affichage', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Nom A–Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
};
