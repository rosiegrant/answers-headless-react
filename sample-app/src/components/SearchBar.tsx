import { useRef, KeyboardEvent } from 'react';
import { useAnswersActions } from '@yext/answers-headless-react';
import '../sass/SearchBar.scss';
import { useEffect } from 'react';
import Autocomplete from './Autocomplete';
import { ReactComponent as MagnifyingGlassIcon } from '../icons/magnifying_glass.svg';

function SearchBar({ name, verticalKey }: { name: string, verticalKey: string }) {
  const answersActions = useAnswersActions();
  useEffect(() => answersActions.setVerticalKey(verticalKey))
  const inputRef = useRef<HTMLInputElement>(document.createElement('input'));

  const executeSearch = () => {
    answersActions.executeVerticalQuery();
  }
  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      executeSearch();
    }
  }
  const handleChange = () => {
    answersActions.setQuery(inputRef.current.value || '');
    answersActions.executeVerticalAutoComplete(name);
  }
  return (
    <div className='SearchBar'>
      <div className='SearchBar-search'>
        <input
          className='SearchBar-input'
          ref={inputRef}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
        />
        <button className='SearchBar-submit' onClick={executeSearch}>
          <MagnifyingGlassIcon/>
        </button>
      </div>
      <Autocomplete
        autocompleteId='main-searchbar'
        inputRef={inputRef}
      />
    </div>
  )
}

export default SearchBar;