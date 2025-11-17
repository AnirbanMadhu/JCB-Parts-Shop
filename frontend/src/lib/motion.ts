/**
 * Framer Motion animation variants for enterprise UI
 * Consistent animations across the application
 */

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const slideInFromRight = {
  hidden: { x: 100, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { 
      type: 'spring' as const, 
      damping: 25, 
      stiffness: 300 
    } 
  },
  exit: { x: 100, opacity: 0, transition: { duration: 0.2 } }
};

export const slideInFromLeft = {
  hidden: { x: -100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { x: -100, opacity: 0, transition: { duration: 0.2 } }
};

export const slideInFromBottom = {
  hidden: { y: 50, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { y: 50, opacity: 0, transition: { duration: 0.2 } }
};

export const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { scale: 0.9, opacity: 0, transition: { duration: 0.2 } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export const staggerItem = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      type: 'spring' as const, 
      damping: 20, 
      stiffness: 300 
    } 
  }
};

// Modal/Dialog animations
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export const modalContent = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 400 }
  },
  exit: { scale: 0.95, opacity: 0, y: 20, transition: { duration: 0.2 } }
};

// Card animations
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { type: 'spring', damping: 15, stiffness: 300 }
  }
};

// List item animations
export const listItemHover = {
  rest: { x: 0, backgroundColor: 'rgba(0,0,0,0)' },
  hover: { 
    x: 4,
    backgroundColor: 'rgba(0,0,0,0.02)',
    transition: { duration: 0.2 }
  }
};

// Button animations
export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.1 }
};

// Notification animations
export const notificationSlideIn = {
  hidden: { x: 400, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  },
  exit: { 
    x: 400, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Loading spinner
export const spinner = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: 'linear' }
  }
};

// Pulse animation for alerts
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  }
};
