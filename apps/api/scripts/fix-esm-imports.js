#!/usr/bin/env node
// Post-build script to add .js extensions to relative imports in ESM output
// NestJS/SWC builds to ESM but doesn't add extensions, which are required for ESM runtime

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function fixImportsInFile(filePath) {
  const content = await readFile(filePath, 'utf-8')
  
  // Fix relative imports: from './file' -> from './file.js'
  // Match imports like: import x from "./file" or from '../module'
  // But skip imports that already have extensions (.js, .json, .mjs, .cjs)
  let fixed = content.replace(
    /from\s+['"](\.[^'"]*)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]/g,
    (match, path) => {
      // Only fix relative imports (starting with .)
      if (path.startsWith('.')) {
        return match.replace(path, `${path}.js`)
      }
      return match
    }
  )
  
  // Fix lodash subpath imports: from 'lodash/isPlainObject' -> from 'lodash/isPlainObject.js'
  // Lodash subpath imports need .js extensions in ESM
  fixed = fixed.replace(
    /from\s+['"](lodash\/[^'"]*)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]/g,
    (match, path) => {
      return match.replace(path, `${path}.js`)
    }
  )
  
  // Also fix dynamic imports: import('./file') -> import('./file.js')
  fixed = fixed.replace(
    /import\s*\(\s*['"](\.[^'"]*)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]\s*\)/g,
    (match, path) => {
      if (path.startsWith('.')) {
        return match.replace(path, `${path}.js`)
      }
      return match
    }
  )
  
  // Fix dynamic lodash imports: import('lodash/isPlainObject') -> import('lodash/isPlainObject.js')
  fixed = fixed.replace(
    /import\s*\(\s*['"](lodash\/[^'"]*)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)['"]\s*\)/g,
    (match, path) => {
      return match.replace(path, `${path}.js`)
    }
  )
  
  if (content !== fixed) {
    await writeFile(filePath, fixed, 'utf-8')
    return true
  }
  return false
}

async function fixImportsInDirectory(dir) {
  const files = await readdir(dir, { withFileTypes: true })
  
  for (const file of files) {
    const filePath = join(dir, file.name)
    
    if (file.isDirectory()) {
      await fixImportsInDirectory(filePath)
    } else if (file.name.endsWith('.js') && !file.name.endsWith('.map')) {
      await fixImportsInFile(filePath)
    }
  }
}

const distDir = join(__dirname, '../dist')
await fixImportsInDirectory(distDir)
console.log('Fixed ESM import extensions in dist/')

