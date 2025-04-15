import React, { useRef, useEffect } from 'react';
import { useScreen } from '@/hooks/useScreen';
import { motion } from 'framer-motion';

interface WelcomeTitleEffectProps {
  children: React.ReactNode;
  className?: string;
}

const WelcomeTitleEffect: React.FC<WelcomeTitleEffectProps> = ({ children, className = '' }) => {
  const titleRef = useRef<HTMLDivElement>(null);
  const screen = useScreen();

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate relative mouse position within the element
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Update custom CSS variables
      element.style.setProperty('--mouse-x', `${x}%`);
      element.style.setProperty('--mouse-y', `${y}%`);
    };

    // Add automatic "pulse" effect when there's no interaction
    let interval: NodeJS.Timeout;
    
    const startPulseEffect = () => {
      let step = 0;
      interval = setInterval(() => {
        // Simulate mouse movement in a circular pattern
        const angle = (step % 360) * (Math.PI / 180);
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        
        element.style.setProperty('--mouse-x', `${x}%`);
        element.style.setProperty('--mouse-y', `${y}%`);
        
        step += 1;
      }, 50);
    };

    // Start pulse effect automatically
    startPulseEffect();

    // Add listeners for when mouse enters/leaves
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', () => {
      // Stop automatic effect when mouse enters
      clearInterval(interval);
    });
    element.addEventListener('mouseleave', () => {
      // Restart automatic effect when mouse leaves
      startPulseEffect();
    });

    return () => {
      // Clear event listeners when component unmounts
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', () => clearInterval(interval));
      element.removeEventListener('mouseleave', startPulseEffect);
      clearInterval(interval);
    };
  }, []);

  // Apply more compact styles on mobile devices
  const mobileStyles = screen.isMobile && !screen.isLandscape
    ? { padding: '0.5rem 1rem', margin: '0.2rem', fontSize: '1.5rem' }
    : {};

  return (
    <motion.div 
      ref={titleRef} 
      className={`welcome-title-animation relative text-center mb-8 pb-4 ${className}`}
      style={mobileStyles}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.2, 
            ease: [0.22, 1, 0.36, 1] 
          }}
        >
          {children}
        </motion.div>
      </div>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-amber-50/10 to-amber-100/20 dark:from-amber-900/10 dark:via-amber-800/5 dark:to-amber-900/10 rounded-xl opacity-60 blur-md"
        style={{ 
          background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(251, 191, 36, 0.15), transparent 60%)',
          zIndex: 0 
        }}
      />
    </motion.div>
  );
};

export default WelcomeTitleEffect; 