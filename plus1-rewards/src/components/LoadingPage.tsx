import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingPageProps {
  onLoadComplete?: () => void;
}

export default function LoadingPage({ onLoadComplete }: LoadingPageProps = {}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Notify parent that loading is complete
          if (onLoadComplete) {
            setTimeout(() => onLoadComplete(), 500); // Small delay for smooth transition
          }
          return 100;
        }
        return prev + 1;
      });
    }, 30); // 30ms * 100 = 3 seconds total

    return () => clearInterval(timer);
  }, [onLoadComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden"
    >
      {/* Ambient Background Glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.05, 0.15, 0.05],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[600px] h-[600px] bg-[#1a568b]/5 rounded-full blur-[120px]"
      />

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2,
          }}
          className="relative"
        >
          {/* Logo Image */}
          <div className="relative p-8">
            <img
              src="/logo.png"
              alt="Plus1Rewards Logo"
              className="h-24 w-auto relative z-20"
            />

            {/* Shimmer Effect */}
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#37d270]/10 to-transparent skew-x-12 z-10"
            />
          </div>
        </motion.div>

        {/* Brand Name / Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 text-center"
        >
          <h1 className="text-[#1a568b] font-sans font-semibold tracking-[0.4em] text-sm uppercase">
            Plus1Rewards
          </h1>
          <p className="text-zinc-400 font-sans text-[10px] uppercase tracking-[0.2em] mt-2">
            Medi Cover
          </p>
        </motion.div>

        {/* Progress Section */}
        <div className="mt-12 w-64 relative">
          <div className="h-[2px] w-full bg-zinc-100 overflow-hidden relative rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#1a568b] to-[#37d270] shadow-[0_0_10px_rgba(26,85,139,0.3)]"
            />
          </div>
          <div className="flex justify-between mt-3">
            <span className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest">
              Medi Cover
            </span>
            <span className="text-[9px] text-[#1a568b] font-mono font-bold">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.2, 0],
              y: [0, -100],
              x: (i - 2.5) * 100,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
            className="absolute bottom-0 left-1/2 w-[1px] h-20 bg-gradient-to-t from-[#37d270]/20 to-transparent"
          />
        ))}
      </div>
    </motion.div>
  );
}
