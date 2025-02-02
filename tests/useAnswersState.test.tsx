import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { provideAnswersHeadless, Result } from '@yext/answers-headless';
import { State } from '@yext/answers-headless/lib/esm/models/state';
import React, { useCallback, useReducer } from 'react';
import { AnswersHeadlessContext, useAnswersActions, useAnswersState } from '../src';

it('invoke useAnswersState outside of AnswersHeadlessProvider', () => {
  function Test(): JSX.Element {
    const query = useAnswersState(state => state.query.input);
    return <div>{query}</div>;
  }
  jest.spyOn(global.console, 'error').mockImplementation();
  try {
    render(<Test />);
  } catch(e) {
    expect(e).toEqual(new Error('Attempted to call useAnswersState() outside of AnswersHeadlessProvider.'
    + ' Please ensure that \'useAnswersState()\' is called within an AnswersHeadlessProvider component.'));
  }
  jest.clearAllMocks();
});

it('does not perform extra renders/listener registrations for nested components', async () => {
  const parentStateUpdates: Result[][] = [];
  const childStateUpdates: string[] = [];
  let pendingVerticalQuery;
  function Test() {
    const actions = useAnswersActions();
    const results = useAnswersState(state => {
      return state?.vertical?.results;
    }) || [];
    parentStateUpdates.push(results);
    const search = useCallback(() => {
      actions.setQuery('iphone');
      pendingVerticalQuery = actions.executeVerticalQuery();
    }, [actions]);

    return (
      <div>
        <button onClick={search}>Search</button>
        {!!results?.length && <Child results={results} />}
      </div>
    );
  }

  function Child({ results }: { results: Result[] }) {
    const queryId = useAnswersState(state => {
      return state.query.queryId;
    }) || '';
    childStateUpdates.push(queryId);

    return (
      <div>
        <div>{queryId}:</div>
        <div>{JSON.stringify(results)}</div>
      </div>
    );
  }

  const answers = createAnswersHeadless();
  const addListenerSpy = jest.spyOn(answers, 'addListener');
  expect(addListenerSpy).toHaveBeenCalledTimes(0);
  expect(parentStateUpdates).toHaveLength(0);
  expect(childStateUpdates).toHaveLength(0);
  render(
    <AnswersHeadlessContext.Provider value={answers}>
      <Test />
    </AnswersHeadlessContext.Provider>
  );
  expect(addListenerSpy).toHaveBeenCalledTimes(1);
  expect(parentStateUpdates).toHaveLength(1);
  expect(childStateUpdates).toHaveLength(0);

  await act(async () => {
    userEvent.click(screen.getByText('Search'));
    await pendingVerticalQuery;
  });
  // Check that only a single addListener call is made for the conditionally rendered Child
  expect(addListenerSpy).toHaveBeenCalledTimes(2);
  expect(parentStateUpdates).toHaveLength(2);
  expect(childStateUpdates).toHaveLength(1);

  await act(async () => {
    userEvent.click(screen.getByText('Search'));
    await pendingVerticalQuery;
  });
  // Check that additional addListener calls are not made
  expect(addListenerSpy).toHaveBeenCalledTimes(2);
  expect(parentStateUpdates).toHaveLength(3);
  expect(childStateUpdates).toHaveLength(2);
});

it('does not trigger render on unmounted component', async () => {
  const consoleSpy = jest.spyOn(console, 'error');
  function ParentComponent() {
    const results = useAnswersState(state => state.universal?.verticals) || [];
    return <div>{results.map((_, index) => <ChildComponent key={index}/>)}</div>;
  }

  function ChildComponent() {
    useAnswersState(state => state);
    return <div>child component</div>;
  }

  const answers = createAnswersHeadless();
  render(
    <AnswersHeadlessContext.Provider value={answers}>
      <ParentComponent/>
    </AnswersHeadlessContext.Provider>
  );
  act(() => answers.setQuery('resultsWithFilter'));
  await act( () => answers.executeUniversalQuery());
  act(() => answers.setQuery('default'));
  await act( () => answers.executeUniversalQuery());
  expect(consoleSpy).not.toHaveBeenCalledWith(
    expect.stringMatching('Can\'t perform a React state update on an unmounted component'),
    expect.anything(),
    expect.stringMatching('ChildComponent'));
});

describe('uses the most recent selector',() => {
  it('for determining the hook\'s return value', () => {
    let selector = () => 'initial selector';

    function Test() {
      const selectedState: string = useAnswersState(selector);
      const [, triggerRender] = useReducer(s => s + 1, 0);

      return (
        <>
          <button onClick={triggerRender}>rerender</button>
          <span data-testid='selected-state'>{selectedState}</span>
        </>
      );
    }

    const answers = createAnswersHeadless();
    render(
      <AnswersHeadlessContext.Provider value={answers}>
        <Test />
      </AnswersHeadlessContext.Provider>
    );
    expect(screen.getByTestId('selected-state')).toHaveTextContent('initial selector');

    selector = () => 'new selector';
    act(() => userEvent.click(screen.getByText('rerender')));
    expect(screen.getByTestId('selected-state')).toHaveTextContent('new selector');
  });

  it('for determining whether to trigger a rerender', () => {
    type Selector = (state: State) => string | number | undefined;
    let selector: Selector = state => {
      return state.query.input;
    };
    const stateUpdates: (string | undefined | number)[] = [];

    function Test() {
      const selectedState: string | undefined | number = useAnswersState(selector);
      const [, triggerRender] = useReducer(s => s + 1, 0);
      stateUpdates.push(selectedState);

      return (
        <>
          <button onClick={triggerRender}>rerender</button>
          <span data-testid='selected-state'>{selectedState}</span>
        </>
      );
    }

    const answers = createAnswersHeadless();
    answers.setQuery('initial value');
    expect(stateUpdates).toHaveLength(0);
    render(
      <AnswersHeadlessContext.Provider value={answers}>
        <Test />
      </AnswersHeadlessContext.Provider>
    );
    expect(stateUpdates).toEqual(['initial value']);

    act(() => {
      let numNewSelectorCalls = 0;
      selector = () => {
        return ++numNewSelectorCalls;
      };
      userEvent.click(screen.getByText('rerender'));
    });
    expect(stateUpdates).toEqual(['initial value', 1]);

    act(() => {
      answers.setContext('trigger a state update that would not update the initial selector');
    });
    expect(stateUpdates).toEqual(['initial value', 1, 3]);
  });
});

function createAnswersHeadless() {
  const answers = provideAnswersHeadless({
    apiKey: 'fake api key',
    experienceKey: 'fake exp key',
    locale: 'en',
  });
  answers.setVerticalKey('fakeVerticalKey');
  return answers;
}