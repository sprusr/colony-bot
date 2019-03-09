import { AnyAction } from 'redux'
import { eventChannel } from 'redux-saga'
import { call, put, take, takeEvery, setContext } from 'redux-saga/effects'
import { getNetworkClient } from '@colony/colony-js-client'
import { open } from '@colony/purser-software'
import ipfsClient from 'ipfs-http-client'

import {
  GITHUB_ISSUE_OPENED,
  COLONY_TASK_CREATED,
  GITHUB_COMMENT_ADDED,
  COLONY_TASK_ASSIGNED,
  GITHUB_ISSUE_ASSIGNED,
  GITHUB_PR_OPENED,
  COLONY_TASK_FINALIZED
} from './actions'

const colonyAddress = process.env.COLONY_ADDRESS
const colonyDomain = 1

let colonyClient: any, ipfs: any

function* setupContext () {
  const wallet = yield call(open, {
    privateKey: '0x0355596cdb5e5242ad082c4fe3f8bbe48c9dba843fe1f99dd8272f487e70efae',
  })
  const networkClient = yield call(getNetworkClient, 'local', wallet)
  colonyClient = yield call([networkClient, networkClient.getColonyClientByAddress], colonyAddress)
  ipfs = yield call(ipfsClient, { host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
  yield setContext({
    colonyClient,
    ipfs
  })

  const channel = eventChannel(emit => {
    colonyClient.events.TaskAdded.addListener((payload: object) => {
      emit({ type: COLONY_TASK_CREATED, payload })
    })

    colonyClient.events.TaskRoleUserSet.addListener((payload: object) => {
      emit({ type: COLONY_TASK_ASSIGNED, payload })
    })

    colonyClient.events.TaskFinalized.addListener((payload: object) => {
      emit({ type: COLONY_TASK_FINALIZED, payload })
    })

    return () => {}
  })

  while (true) {
    const action = yield take(channel)
    yield put(action)
  }
}

function* githubIssueOpened ({ payload: { context } }: AnyAction) {
  // setup
  // const colonyClient = yield getContext('colonyClient')
  // const ipfs = yield getContext('ipfs')

  // generate the tx
  const issueUri = context.payload.issue.html_url
  const [{ hash: specificationHash }] = yield call(
    [ipfs, ipfs.add],
    new Buffer(issueUri)
  )
  const txArgs = yield call(
    [colonyClient.createTask, colonyClient.createTask.getValidatedArgs],
    { specificationHash, domainId: colonyDomain }
  )
  const txData = yield call(
    [colonyClient.createTask, colonyClient.createTask.createTransactionData],
    txArgs
  )

  // generate the comment
  const txURI = `ethereum:${colonyAddress}?data=${txData}`
  const issueOpenedText = `
Some text should go here about why this is happening, but you should send this transaction to open a Colony task:

\`\`\`
${txURI}
\`\`\`
  `
  const issueComment = context.issue({ body: issueOpenedText })

  // post it
  yield call([context.github.issues, context.github.issues.createComment], issueComment)
}

function* colonyTaskCreated (action: AnyAction) {
  yield call(console.log, 'colony task created')
}

function* githubCommentAdded (action: AnyAction) {
  yield call(console.log, 'comment added')
}

function* githubTaskAssigned (action: AnyAction) {
  yield call(console.log, 'github task assigned')
}

function* colonyTaskAssigned (action: AnyAction) {
  yield call(console.log, 'colony task assigned')
}

function* githubPROpened (action: AnyAction) {
  yield call(console.log, 'github pr opened')
}

function* colonyTaskFinalized (action: AnyAction) {
  yield call(console.log, 'colony task finalized')
}

function* rootSaga () {
  yield takeEvery(GITHUB_ISSUE_OPENED, githubIssueOpened)
  yield takeEvery(COLONY_TASK_CREATED, colonyTaskCreated)
  yield takeEvery(GITHUB_COMMENT_ADDED, githubCommentAdded)
  yield takeEvery(COLONY_TASK_ASSIGNED, colonyTaskAssigned)
  yield takeEvery(GITHUB_ISSUE_ASSIGNED, githubTaskAssigned)
  yield takeEvery(GITHUB_PR_OPENED, githubPROpened)
  yield takeEvery(COLONY_TASK_FINALIZED, colonyTaskFinalized)
  yield call(setupContext)
}

export default rootSaga
