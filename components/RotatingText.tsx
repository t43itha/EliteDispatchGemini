import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence, Transition, Variants } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  mainClassName?: string;
  staggerFrom?: "first" | "last" | "center" | number | "random";
  initial?: any;
  animate?: any;
  exit?: any;
  staggerDuration?: number;
  splitLevelClassName?: string;
  transition?: Transition;
  rotationInterval?: number;
}

const RotatingText = forwardRef<any, RotatingTextProps>(({
  texts,
  mainClassName = "",
  initial = { y: "100%", opacity: 0, filter: "blur(10px)" },
  animate = { y: 0, opacity: 1, filter: "blur(0px)" },
  exit = { y: "-120%", opacity: 0, filter: "blur(10px)" },
  transition = { type: "spring", damping: 25, stiffness: 300 },
  rotationInterval = 2000,
  staggerDuration = 0.05,
  splitLevelClassName = "",
}, ref) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, rotationInterval);
    return () => clearInterval(interval);
  }, [texts, rotationInterval]);

  const currentText = texts[index];
  const characters = currentText.split('');

  return (
    <span className={`${mainClassName} inline-flex relative overflow-hidden py-2 justify-start sm:justify-center text-left sm:text-center`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className={`flex flex-wrap whitespace-nowrap ${splitLevelClassName}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: staggerDuration } },
            exit: { transition: { staggerChildren: staggerDuration, staggerDirection: -1 } }
          }}
        >
          {characters.map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              variants={{
                hidden: initial,
                visible: { ...animate, transition },
                exit: { ...exit, transition }
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </span>
  );
});

RotatingText.displayName = "RotatingText";

export default RotatingText;