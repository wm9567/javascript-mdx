import toHast from 'mdast-util-to-hast'
import toHyper from 'hast-to-hyperscript'

import { createElement } from 'react'

import isLiveEditor from './is-live-editor'
import LiveEditor from './LiveEditor'

module.exports = function transformer (options) {
  const mdComponents = options.mdComponents || {}
  const components = options.components || {}
  const theme = options.theme || {}

  const h = (name, props = {}, children) =>
    isLiveEditor(props)
      ? liveEditorComponent(props, children)
      : createElement(mdComponents[name] || name, props, children)

  const liveEditorComponent = (props, children) => {
    const code = (children[0] || {}).value || ''

    const editorProps = Object.assign({}, props, {
      components,
      theme,
      code
    })

    return createElement(LiveEditor, editorProps, code)
  }

  const transform = node =>
    toHyper(h, {
      type: 'element',
      tagName: 'div',
      properties: {},
      children: toHast(node).children
    })

  const compiler = node => isLiveEditor(node)
    ? transformLiveEditor(node, components)
    : transform(node)

  this.Compiler = compiler
}
