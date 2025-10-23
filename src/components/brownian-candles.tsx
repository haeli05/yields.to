"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function BrownianCandles() {
  const candles = useMemo(() => {
    const total = 42;
    return Array.from({ length: total }, (_, index) => {
      const baseSeed = (index + 1) * 2.17;
      const rand = (offset: number) => pseudoRandom(baseSeed + offset);

      const width = 8 + rand(1) * 4;
      const baseHeight = 60 + rand(2) * 140;
      const upperWick = 10 + rand(3) * 40;
      const lowerWick = 12 + rand(4) * 40;
      const upDuration = 3 + rand(5) * 2;
      const downDuration = 2 + rand(6) * 2;

      return {
        id: index,
        left: index * (width + 12),
        baseHeight,
        baseWidth: width,
        upperWick,
        lowerWick,
        upHeight: baseHeight * (0.6 + rand(7) * 0.6),
        downHeight: baseHeight * (0.4 + rand(8) * 0.3),
        upDuration,
        downDuration,
      };
    });
  }, []);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-black/10 bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05),transparent_70%)]" />
      <AnimatePresence>
        {candles.map((candle) => (
          <motion.div
            key={candle.id}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: candle.left }}
            animate={{
              height: [candle.baseHeight, candle.upHeight, candle.downHeight, candle.baseHeight],
            }}
            transition={{
              duration: candle.upDuration + candle.downDuration,
              times: [0, 0.4, 0.75, 1],
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="w-px bg-black/50"
              animate={{
                height: [
                  candle.upperWick,
                  candle.upperWick * 1.4,
                  candle.upperWick * 0.7,
                  candle.upperWick,
                ],
              }}
              transition={{
                duration: candle.upDuration + candle.downDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-full rounded-sm bg-black"
              animate={{
                height: [
                  candle.baseHeight * 0.6,
                  candle.upHeight * 0.6,
                  candle.downHeight * 0.6,
                  candle.baseHeight * 0.6,
                ],
                width: [
                  candle.baseWidth,
                  candle.baseWidth * 1.1,
                  candle.baseWidth * 0.9,
                  candle.baseWidth,
                ],
              }}
              transition={{
                duration: candle.upDuration + candle.downDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-px bg-black/50"
              animate={{
                height: [
                  candle.lowerWick,
                  candle.lowerWick * 0.7,
                  candle.lowerWick * 1.3,
                  candle.lowerWick,
                ],
              }}
              transition={{
                duration: candle.upDuration + candle.downDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
