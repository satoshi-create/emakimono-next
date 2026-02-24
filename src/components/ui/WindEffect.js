import { motion } from "framer-motion";

const WindEffect = () => {
  return (
    <>
      <motion.div
        className="absolute top-1/4 left-10 z-50"
        animate={{
          x: [0, 80, 40, 150],
          y: [0, -50, -20, -100],
          opacity: [0, 1, 0.5, 0],
          scale: [0.2, 1, 0.8, 1.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: "loop",
        }}
      >
        <svg
          width="30"
          height="15"
          viewBox="0 0 30 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 8 Q7 2, 15 8 Q23 14, 28 8"
            stroke="#8B5E3C"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </motion.div>

      <motion.div
        className="absolute top-2/4 left-20 z-50"
        animate={{
          x: [0, 130, 50, 160],
          y: [0, -30, -60, -90],
          opacity: [0, 1, 0.7, 0],
          scale: [0.5, 1, 0.7, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "loop",
          delay: 0.5,
        }}
      >
        <svg
          width="40"
          height="20"
          viewBox="0 0 40 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 10 Q10 2, 20 10 Q30 18, 38 10"
            stroke="#8B5E3C"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </motion.div>
    </>
  );
};

export default WindEffect;
