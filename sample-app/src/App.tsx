import VerticalResultsDisplay from './components/VerticalResultsDisplay';
import SearchBar from './components/SearchBar';

import './App.css';
import { AnswersActionsProvider } from '@yext/answers-headless-react';
import ResultsCount from './components/ResultsCount';

function App() {
  return (
    <AnswersActionsProvider
      apiKey='2d8c550071a64ea23e263118a2b0680b'
      experienceKey='slanswers'
      locale='en'
    >
      <div className='left'>
        test
      </div>
      <div className='right'>
        <SearchBar verticalKey='people' name='main-searchbar'/>
        <ResultsCount />
        <VerticalResultsDisplay
          randomString='this is my arbitrary string!'
        />
      </div>
    </AnswersActionsProvider>
  );
}

export default App;
