#!/usr/bin/env node
// Post-build script to add .js extensions to lodash subpath imports in ESM output
// Lodash subpath imports need .js extensions in ESM runtime

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const distFile = join(__dirname, '../dist/esm/index.mjs')
const content = await readFile(distFile, 'utf-8')

// Fix lodash subpath imports: from 'lodash/isPlainObject' -> from 'lodash/isPlainObject.js'
const fixed = content.replace(
  /from\s+['"](lodash\/[^'"]*)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]/g,
  (match, path) => match.replace(path, `${path}.js`),
)

if (content !== fixed) {
  await writeFile(distFile, fixed, 'utf-8')
  // eslint-disable-next-line no-console
  console.log('Fixed lodash import extensions in @vencura/lib ESM build')
}

