import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

// ─── REPLACE WITH YOUR PROJECT DETAILS ───────────────────
const PROJECT_ID = '93cr99yi'
const DATASET    = 'production'
// ─────────────────────────────────────────────────────────

export default defineConfig({
  name: 'atelier-forme',
  title: 'Atelier Forme — Studio',

  projectId: PROJECT_ID,
  dataset: DATASET,

  plugins: [
    deskTool({
      structure: S =>
        S.list()
          .title('Contenu')
          .items([
            S.listItem()
              .title('Marques')
              .child(S.documentTypeList('brand').title('Nos marques')),
            S.divider(),
            S.listItem()
              .title('Produits')
              .child(S.documentTypeList('product').title('Catalogue')),
          ]),
    }),
    visionTool(),
  ],

  schema: { types: schemaTypes },
})
