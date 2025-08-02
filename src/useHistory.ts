import { useState } from 'react';

const useHistory = (initialState :any) => {
  const [history, setHistory] = useState([initialState]); // {}, [{},{}], [{}, {}, {}]
  const [currentIndex, setCurrentIndex] = useState(0)

  const undo = () => setCurrentIndex(prev => Math.max(prev - 1, 0));
  const redo = () => setCurrentIndex(prev => Math.min(prev + 1, history.length - 1));
 
  // action is a state, or a function
  const setState = (action, overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
    // using overwrite to determine if we should replace the current state or add to history
    if (overwrite) {
      history[currentIndex] = newState;
      setHistory([...history]);
    }else{
      // if we r adding a state, it shall remove all the states behind the currentIndex to avoid breaking down.
      // index --> 1
      // [[], [{}, {}], [{}, {}, {}]]
      // slice the history from 0 to 1
      const updatedState = history.slice(0, currentIndex + 1);
      console.log(updatedState, 'updated state');
      console.log(newState, 'adding new state to the above');
      setHistory([...updatedState, newState]);
     
      setCurrentIndex(prev => prev + 1);
    }
  }

  return [history[currentIndex], setState, undo, redo] ;
}


export default useHistory;
