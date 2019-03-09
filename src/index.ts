import { Application } from 'probot'

import store from './store'
import {
  GITHUB_ISSUE_OPENED,
  GITHUB_COMMENT_ADDED,
  GITHUB_ISSUE_ASSIGNED,
  GITHUB_PR_OPENED
} from './actions'

export = (app: Application) => {
  app.on('issues.opened', async (context) => {
    store.dispatch({
      type: GITHUB_ISSUE_OPENED,
      payload: { context }
    })
  })
  app.on('issue_comment.created', async (context) => {
    store.dispatch({
      type: GITHUB_COMMENT_ADDED,
      payload: { context }
    })
  })
  app.on('issues.assigned', async (context) => {
    store.dispatch({
      type: GITHUB_ISSUE_ASSIGNED,
      payload: { context }
    })
  })
  app.on('pull_request.opened', async (context) => {
    store.dispatch({
      type: GITHUB_PR_OPENED,
      payload: { context }
    })
  })
}
