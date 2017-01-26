import React from 'react'

import style from './style.scss'

export default class TemplateModule extends React.Component {

  render() {
    return <div>
      <h2>Botkit Integration</h2>
      <h3>There's nothing to see here. You must use botkit programmatically (see the <a href="https://github.com/botpress/botpress-botkit" target="_blank">readme</a>).</h3>
      <p>You are seeing this because there is no way to create modules without any UI in botpress yet. There's an <a href="https://github.com/botpress/botpress/issues/34" target="_blank">open issue about this</a> and we would very much like a pull request!</p>
    </div>
  }
}
