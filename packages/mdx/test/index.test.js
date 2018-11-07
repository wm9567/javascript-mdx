const babel = require('@babel/core')
const mdx = require('../index')
const mdxHastToJsx = require('../mdx-hast-to-jsx')
const fs = require('fs')
const path = require('path')
const { select } = require('hast-util-select')
const prism = require('@mapbox/rehype-prism')
const math = require('remark-math')
const katex = require('rehype-katex')

const fixtureBlogPost = fs.readFileSync(
  path.join(__dirname, './fixtures/blog-post.md')
)

const parse = code =>
  babel.parse(code, {
    plugins: [
      '@babel/plugin-syntax-jsx',
      '@babel/plugin-proposal-object-rest-spread'
    ]
  })

it('Should output parseable JSX', async () => {
  const result = await mdx('Hello World')

  parse(result)
})

it('Should output parseable JSX when using < or >', async () => {
  const result = await mdx(`
  # Hello, MDX

  I <3 Markdown and JSX
  `)

  parse(result)
})

it('Should compile sample blog post', async () => {
  const result = await mdx(fixtureBlogPost)

  parse(result)
})

it('Should render blockquote correctly', async () => {
  const result = await mdx('> test\n\n> `test`')

  parse(result)
})

it('Should render HTML inside inlineCode correctly', async () => {
  const result = await mdx('`<div>`')

  expect(result).toContain(
    '<MDXTag name="inlineCode" components={components} parentName="p">{`<div>`}</MDXTag>'
  )
})

it('Should preserve newlines in code blocks', async () => {
  const result = await mdx(
    `
\`\`\`dockerfile
# Add main script
COPY start.sh /home/start.sh
\`\`\`
  `,
    { hastPlugins: [prism] }
  )

  expect(result).toContain('{`# Add main script`}</MDXTag>{`\n`}')
})

it('Should preserve infostring in code blocks', async () => {
  const result = await mdx(
    `
\`\`\`dockerfile exec registry=something.com
# Add main script
COPY start.sh /home/start.sh
\`\`\`
  `
  )

  expect(result).toContain(
    `props={{"className":"language-dockerfile","metastring":"exec registry=something.com","exec":true,"registry":"something.com"}}`
  )
})

it('Should support comments', async () => {
  const result = await mdx(`
<!-- a Markdown comment -->
A paragraph

Some text <!-- an inline comment -->

\`\`\`md
<!-- a code block string -->
\`\`\`

<div>
  {/* a nested JSX comment */}
  <!-- div content -->
</div>

<!-- a comment above -->
- list item
<!-- a comment below -->

--> should be as-is

<MyComp content={\`
  <!-- a template literal -->
\`}
  `)
  expect(result).toContain('{/* a Markdown comment */}')
  expect(result).toContain('{/* an inline comment */}')
  expect(result).toContain('<!-- a code block string -->')
  expect(result).toContain('{/* a nested JSX comment */}')
  expect(result).toContain('<!-- div content -->')
  expect(result).toContain('{/* a comment above */}')
  expect(result).toContain('{/* a comment below */}')
  expect(result).toContain('--> should be as-is')
  expect(result).toContain('<!-- a template literal -->')
})

it('Should convert style strings to camelized objects', async () => {
  const result = await mdx(`
$$
\\sum{1}
$$
  `, {
    mdPlugins: [math],
    hastPlugins: [katex],
  })
  expect(result).not.toContain('"style":"')
  expect(result).toContain('"style":{')
})

it('Should convert data-* and aria-* properties to param-case', async () => {
  const result = await mdx(`
$$
\\sum{1}
$$
  `, {
    mdPlugins: [math],
    hastPlugins: [katex],
  })
  expect(result).toContain('"aria-hidden":"true"')
})

it('Should support multiline default export statement', async () => {
  const result = await mdx(`export default ({ children }) => (
  <Layout>
    {children}
  </Layout>
)`)
  expect(() => parse(result)).not.toThrow()
})

it('Should support semicolons in default export statement', async () => {
  const result = await mdx(`export default Layout;`)
  expect(() => parse(result)).not.toThrow()
})

it('Should throw when exporting default via named export', async () => {
  await expect(mdx(`export { default } from './Layout'`)).rejects.toThrow()
  await expect(mdx(`export { Layout as default }`)).rejects.toThrow()
  await expect(mdx(`export { default as MyComp } from './MyComp'`)).resolves
    .toContain(`export { default as MyComp } from './MyComp'`)
})

it('Should not include export wrapper if skipExport is true', async () => {
  const result = await mdx('> test\n\n> `test`', { skipExport: true })

  expect(result).not.toContain('export default ({components, ...props}) =>')
})

it('Should recognize components as properties', async () => {
  const result = await mdx('# Hello\n\n<MDX.Foo />')
  expect(result).toContain(
    '<MDXTag name="h1" components={components}>{`Hello`}</MDXTag>\n<MDX.Foo />'
  )
})

it('Should render elements without wrapping blank new lines', async () => {
  const result = await mdx(`
  | Test | Table |
  | :--- | :---- |
  | Col1 | Col2  |`)

  expect(result).not.toContain('{`\n`}')
})

test('Should await and render async plugins', async () => {
  const result = await mdx(fixtureBlogPost, {
    hastPlugins: [
      options => tree => {
        return (async () => {
          const headingNode = select('h1', tree)
          const textNode = headingNode.children[0]
          textNode.value = textNode.value.toUpperCase()
        })()
      }
    ]
  })

  expect(result).toMatch(/HELLO, WORLD!/)
})

test('Should process filepath and pass it to the plugins', async () => {
  const result = await mdx(fixtureBlogPost, {
    filepath: 'hello.mdx',
    hastPlugins: [
      options => (tree, fileInfo) => {
        expect(fileInfo.path).toBe('hello.mdx')
        const headingNode = select('h1', tree)
        const textNode = headingNode.children[0]
        textNode.value = textNode.value.toUpperCase()
      }
    ]
  })

  expect(result).toMatch(/HELLO, WORLD!/)
})

test(
  'Should parse and render footnotes',
  async () => {
    const result = await mdx(
      'This is a paragraph with a [^footnote]\n\n[^footnote]: Here is the footnote'
    )

    expect(result).toContain(
      '<MDXTag name="sup" components={components} parentName="p" props={{"id":"fnref-footnote"}}>'
    )

    expect(result).toContain(
      '<MDXTag name="li" components={components} parentName="ol" props={{"id":"fn-footnote"}}>'
    )
  },
  10000
)

test('Should expose a sync compiler', async () => {
  const result = mdx.sync(fixtureBlogPost)

  expect(result).toMatch(/Hello, world!/)
})
