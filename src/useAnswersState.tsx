import { useContext, useEffect, useState} from 'react';
import { State } from '@yext/answers-headless/lib/esm/models/state';
import { AnswersActionsContext } from './AnswersActionsContext';
import isEqual from 'lodash.isequal';

export type StateMapper<T> = (s: State) => T;

function isObj(obj: unknown): obj is Record<string, unknown> {
  return !!obj && typeof obj === 'object';
}

/**
 * Returns the Answers State returned by the map function
 */
export function useAnswersState<T>(mapState: StateMapper<T>): T {
  const statefulCore = useContext(AnswersActionsContext);
  const [stateValue, setState] = useState(mapState(statefulCore.state));

  useEffect(() => {
    // Store the previous state manually, as a work around for react batching state updates.
    // A batched state update will not update immediately, causing additional the listener callback
    // to run additional times.
    let previousStateValue = stateValue;
    return statefulCore.addListener({
      valueAccessor: mapState,
      callback: (newStateValue: T) => {
        const hasObjState = isObj(newStateValue) && isObj(previousStateValue);
        if (!hasObjState || !isEqual(
          previousStateValue as Record<string, unknown>, newStateValue as Record<string, unknown>))
        {
          if (hasObjState || (!hasObjState && previousStateValue !== newStateValue)) {
            previousStateValue = newStateValue;
            setState(newStateValue);
          }
        }
      }
    });
  });

  return stateValue;
}