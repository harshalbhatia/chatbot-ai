import { useEffect,useRef, useState } from 'react';
import { KEYPRESS_COMBO } from '../../utils/app/const';
type KeyPressEvent = {
    key: string;
};
type KeypressDetectorProps = {
    onPress: (key: string) => void;
};
export default function KeypressDetector({ onPress }: KeypressDetectorProps): JSX.Element {
    // Keypress detection
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

  const handleKeyDown = (event: KeyboardEvent) => {
    const newKeysPressed = new Set(keysPressed);
    newKeysPressed.add(event.key);
    console.log("🚀 ~ file: KeyPressDetector.tsx:15 ~ handleKeyDown ~ event.key:", event.key)
    let hasNum = false;
    if (newKeysPressed.has(KEYPRESS_COMBO) && [1,2,3,4,5,6,7,8,9].includes(Number(event.key))) {
      hasNum = true;
      console.log(`${KEYPRESS_COMBO} + ${event.key} pressed`);
      onPress(`${KEYPRESS_COMBO}+${event.key}`);
    }

    if(hasNum){
      return setKeysPressed(new Set());
    }
    setKeysPressed(newKeysPressed);
  };

  const handleKeyUp = (event: KeyPressEvent) => {
    const newKeysPressed = new Set(keysPressed);
    newKeysPressed.delete(event.key);
    setKeysPressed(newKeysPressed);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed]);
// ------------
  return <></>
}