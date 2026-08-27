import { motion } from "framer-motion";

const ScrollSvg = () => {
  return (
    <motion.div
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg
        width="120"
        height="180"
        viewBox="0 0 120 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scroll background */}
        <rect
          x="10"
          y="10"
          width="100"
          height="160"
          rx="5"
          fill="#E6D7C3"
          stroke="#8B5E3C"
          strokeWidth="2"
        />

        {/* Content lines */}
        <path d="M20 40 H100" stroke="#8B5E3C" strokeWidth="1" />
        <path d="M20 55 H100" stroke="#8B5E3C" strokeWidth="1" />
        <path d="M20 70 H90" stroke="#8B5E3C" strokeWidth="1" />

        {/* 404 styling */}
        <text
          x="60"
          y="110"
          fontFamily="serif"
          fontSize="28"
          fontWeight="bold"
          textAnchor="middle"
          fill="#8B5E3C"
        >
          404
        </text>

        {/* More content lines */}
        <path d="M20 125 H80" stroke="#8B5E3C" strokeWidth="1" />
        <path d="M20 140 H100" stroke="#8B5E3C" strokeWidth="1" />
        <path d="M20 155 H60" stroke="#8B5E3C" strokeWidth="1" />
      </svg>
    </motion.div>
  );
};

export default ScrollSvg;
