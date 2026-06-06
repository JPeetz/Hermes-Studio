import { marked } from 'marked'
import { createContext, memo, useContext, useId, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { CodeBlock } from './code-block'
import type { Components } from 'react-markdown'
import { cn } from '@/lib/utils'

export type MarkdownProps = {
  children: string
  id?: string
  className?: string
  components?: Partial<Components>
}

function parseMarkdownIntoBlocks(markdown: string): Array<string> {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

function extractLanguage(className?: string): string {
  if (!className) return 'text'
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : 'text'
}

type TableRenderContextValue = {
  headersRef: React.MutableRefObject<Array<string>>
  columnIndexRef: React.MutableRefObject<number>
  collectingHeaderRef: React.MutableRefObject<boolean>
}

const TableRenderContext = createContext<TableRenderContextValue | null>(null)

function useTableRenderContext() {
  return useContext(TableRenderContext)
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map((item: React.ReactNode) => textFromNode(item)).join('')
  }
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props: { children?: React.ReactNode } }
    return textFromNode(element.props.children)
  }
  return ''
}

function slugifyHeading(children: React.ReactNode): string {
  const raw = textFromNode(children)
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
  return raw.length > 0 ? raw : 'section'
}

const INITIAL_COMPONENTS: Partial<Components> = {
  code: function CodeComponent({ className, children }) {
    const isInline = !className?.includes('language-')

    if (isInline) {
      return (
        <code className="rounded bg-primary-100 px-1.5 py-0.5 text-[0.9em] font-mono text-primary-900 border border-primary-200">
          {children}
        </code>
      )
    }

    const language = extractLanguage(className)
    return (
      <CodeBlock
        content={String(children ?? '')}
        language={language}
        className="w-full my-2"
      />
    )
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
  h1: function H1Component({ children }) {
    return (
      <h1 className="mt-5 mb-2 text-2xl leading-tight font-medium text-primary-950 text-balance first:mt-0">
        {children}
      </h1>
    )
  },
  h2: function H2Component({ children }) {
    const id = slugifyHeading(children)
    return (
      <h2
        id={id}
        className="mt-5 mb-2 text-xl leading-tight font-medium text-primary-950 text-balance first:mt-0"
      >
        <a
          href={`#${id}`}
          className="group/heading inline-flex items-center gap-1 no-underline"
        >
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="text-primary-500 opacity-0 transition-opacity group-hover/heading:opacity-100"
          >
            #
          </span>
        </a>
      </h2>
    )
  },
  h3: function H3Component({ children }) {
    const id = slugifyHeading(children)
    return (
      <h3
        id={id}
        className="mt-4 mb-1.5 text-lg leading-tight font-medium text-primary-950 text-balance first:mt-0"
      >
        <a
          href={`#${id}`}
          className="group/heading inline-flex items-center gap-1 no-underline"
        >
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="text-primary-500 opacity-0 transition-opacity group-hover/heading:opacity-100"
          >
            #
          </span>
        </a>
      </h3>
    )
  },
  h4: function H4Component({ children }) {
    return (
      <h4 className="mt-4 mb-1.5 text-base leading-tight font-medium text-primary-950 text-balance first:mt-0">
        {children}
      </h4>
    )
  },
  h5: function H5Component({ children }) {
    return (
      <h5 className="mt-3.5 mb-1 text-sm leading-tight font-medium text-primary-950 text-balance first:mt-0">
        {children}
      </h5>
    )
  },
  h6: function H6Component({ children }) {
    return (
      <h6 className="mt-3.5 mb-1 text-sm leading-tight font-medium text-primary-900 text-balance first:mt-0">
        {children}
      </h6>
    )
  },
  p: function PComponent({ children }) {
    return (
      <p className="text-primary-950 text-pretty leading-relaxed">{children}</p>
    )
  },
  ul: function UlComponent({ children }) {
    return (
      <ul className="ml-4 list-disc text-primary-950 marker:text-primary-400">
        {children}
      </ul>
    )
  },
  ol: function OlComponent({ children }) {
    return (
      <ol className="ml-4 list-decimal text-primary-950 marker:text-primary-500">
        {children}
      </ol>
    )
  },
  li: function LiComponent({ children }) {
    return <li className="leading-relaxed">{children}</li>
  },
  a: function AComponent({ children, href }) {
    return (
      <a
        href={href}
        className="text-primary-950 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-950 hover:decoration-primary-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  },
  blockquote: function BlockquoteComponent({ children }) {
    return (
      <blockquote className="border-l-2 border-primary-300 pl-4 text-primary-900 italic">
        {children}
      </blockquote>
    )
  },
  strong: function StrongComponent({ children }) {
    return <strong className="font-medium text-primary-950">{children}</strong>
  },
  em: function EmComponent({ children }) {
    return <em className="italic text-primary-950">{children}</em>
  },
  hr: function HrComponent() {
    return <hr className="my-3 border-primary-200" />
  },
  table: function TableComponent({ children }) {
    const headersRef = useRef<Array<string>>([])
    const columnIndexRef = useRef(0)
    const collectingHeaderRef = useRef(false)
    return (
      <TableRenderContext.Provider
        value={{ headersRef, columnIndexRef, collectingHeaderRef }}
      >
        <div className="my-3 max-w-full overflow-x-auto rounded-lg border border-primary-200 bg-primary-50/20">
          <table className="w-full min-w-max border-collapse text-sm sm:min-w-full tabular-nums">
            {children}
          </table>
        </div>
      </TableRenderContext.Provider>
    )
  },
  thead: function TheadComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.collectingHeaderRef.current = true
      context.columnIndexRef.current = 0
      context.headersRef.current = []
    }
    return (
      <thead className="sticky top-0 z-10 border-b border-primary-200 bg-primary-100/95 backdrop-blur-sm max-sm:hidden">
        {children}
      </thead>
    )
  },
  tbody: function TbodyComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.collectingHeaderRef.current = false
      context.columnIndexRef.current = 0
    }
    return (
      <tbody className="divide-y divide-primary-100 max-sm:block max-sm:divide-y-0">
        {children}
      </tbody>
    )
  },
  tr: function TrComponent({ children }) {
    const context = useTableRenderContext()
    if (context) {
      context.columnIndexRef.current = 0
    }
    return (
      <tr className="odd:bg-primary-50/60 even:bg-primary-100/20 transition-colors hover:bg-primary-100/45 max-sm:mb-3 max-sm:block max-sm:overflow-hidden max-sm:rounded-lg max-sm:border max-sm:border-primary-200 max-sm:bg-primary-50">
        {children}
      </tr>
    )
  },
  th: function ThComponent({ children }) {
    const context = useTableRenderContext()
    const isCollecting = context?.collectingHeaderRef.current
    const index = context?.columnIndexRef.current ?? 0

    if (context && isCollecting) {
      const headerText = textFromNode(children)
      context.headersRef.current[index] = headerText
      context.columnIndexRef.current = index + 1
    }

    return (
      <th className="border-b border-primary-200 px-3 py-2 text-left font-medium text-primary-900 max-sm:hidden">
        {children}
      </th>
    )
  },
  td: function TdComponent({ children }) {
    const context = useTableRenderContext()
    const index = context?.columnIndexRef.current ?? 0
    const headers = context?.headersRef.current ?? []

    if (context) {
      context.columnIndexRef.current = index + 1
    }

    const headerLabel = headers[index]

    return (
      <>
        <td className="border-b border-primary-100 px-3 py-2 text-primary-900 max-sm:hidden">
          {children}
        </td>
        {headerLabel ? (
          <div className="mb-1 flex items-baseline gap-2 text-xs text-primary-600 sm:hidden">
            <span className="font-medium">{headerLabel}</span>
          </div>
        ) : null}
        <div className="border-b border-primary-100 px-3 py-2 text-primary-900 sm:hidden">
          {children}
        </div>
      </>
    )
  },
}

export const Markdown = memo(function MarkdownComponent({
  children,
  id,
  className,
  components,
}: MarkdownProps) {
  const mergedComponents = useMemo(
    () => ({ ...INITIAL_COMPONENTS, ...components }),
    [components],
  )

  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <div id={id} className={cn('prose prose-primary max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={mergedComponents}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
})