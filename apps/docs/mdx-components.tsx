import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Diagram } from '@/components/diagram'
import { ComparisonTable } from '@/components/comparison-table'
import { DocsVideo } from '@/components/docs-video'
import { DocsChart } from '@/components/docs-chart'

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Diagram,
    ComparisonTable,
    DocsVideo,
    DocsChart,
    ...components,
  } as MDXComponents
}
