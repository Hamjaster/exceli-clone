import { useEffect, useState } from 'react';

const useKeys = () : [string[], (key: string) => void] => {
    const [pressedKeys, setPressedKeys] = useState<string[]>([]);

      // Listener for space bar for panning
  useEffect(() => {
    const handleKeyDown = (e : KeyboardEvent) => {
        setPressedKeys((prev : string[]) => [...prev, e.key])
        
    };
    const handleKeyUp = (e : KeyboardEvent) => {
        setPressedKeys((prev) => {
            
            return prev.filter((key) => key !== e.key)
        })
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return [pressedKeys, setPressedKeys] ;
}


export default useKeys;
