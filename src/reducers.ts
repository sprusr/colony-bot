import { AnyAction } from 'redux'
import { STATE_UPDATE_TASK } from './actions';

type Task = {
  // on chain id, if created
  colonyTaskId?: string,
  // map github user id to address
  people: { [userId: string]: string }
}

type State = { [taskId: string]: Task }

const defaultState = {}

const rootReducer = (state: State = defaultState, { type, payload }: AnyAction) => {
  switch (type) {
    case STATE_UPDATE_TASK:
      const { taskId, task } = payload
      return {
        ...state,
        [taskId]: task
      }
  
    default:
      return state
  }
}

export default rootReducer
