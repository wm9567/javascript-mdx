# [remark][]-[mdx][]-remove-imports

[![Build Status][build-badge]][build]
[![lerna][lerna-badge]][lerna]
[![Join the community on Spectrum][spectrum-badge]][spectrum]

Remove import nodes from the [MDXAST][].  This is useful for scenarios where the imports aren’t needed like an MDX playground.

## Installation

[npm][]:

```shell
npm install --save remark-mdx-remove-imports
```

## Usage

Say we have the following MDX file, `example.mdx`:

```markdown
import { Donut } from 'rebass'

import OtherThing from 'other-place'

export default props => <div {...props} />

# Hello, world!

This is a paragraph
```

And our script, `example.js`, looks as follows:

```javascript
const vfile = require('to-vfile')
const remark = require('remark')
const mdx = require('remark-mdx')
const removeImports = require('remark-mdx-remove-imports')

remark()
  .use(mdx)
  .use(removeImports)
  .process(vfile.readSync('example.md'), function(err, file) {
    if (err) throw err
    console.log(String(file))
  })
```

Now, running `node example` yields:

```markdown
export default props => <div {...props} />

# Hello, world!

This is a paragraph
```

## Contribute

See [`contributing.md` in `mdx-js/mdx`][contributing] for ways to get started.

This organisation has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][] © [John Otander][johno]

<!-- Definitions -->

[build]: https://travis-ci.org/mdx-js/mdx

[build-badge]: https://travis-ci.org/mdx-js/mdx.svg?branch=master

[lerna]: https://lernajs.io/

[lerna-badge]: https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg

[spectrum]: https://spectrum.chat/mdx

[spectrum-badge]: https://withspectrum.github.io/badge/badge.svg

[contributing]: https://github.com/mdx-js/mdx/blob/master/contributing.md

[coc]: https://github.com/mdx-js/mdx/blob/master/code-of-conduct.md

[mit]: license

[remark]: https://github.com/remarkjs/remark

[johno]: https://johno.com

[npm]: https://docs.npmjs.com/cli/install

[mdx]: https://mdxjs.com

[mdxast]: https://github.com/mdx-js/specification#mdxast
