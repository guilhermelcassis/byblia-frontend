import React, { useRef, useEffect } from 'react';

interface WelcomeTitleEffectProps {
  children: React.ReactNode;
  className?: string;
}

const WelcomeTitleEffect: React.FC<WelcomeTitleEffectProps> = ({ children, className = '' }) => {
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = titleRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Calcular a posição relativa do mouse dentro do elemento
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Atualizar as variáveis CSS personalizadas
      element.style.setProperty('--mouse-x', `${x}%`);
      element.style.setProperty('--mouse-y', `${y}%`);
    };

    // Também adicionar um efeito de "pulsação" automática quando não há interação
    let interval: NodeJS.Timeout;
    
    const startPulseEffect = () => {
      let step = 0;
      interval = setInterval(() => {
        // Simular movimento do mouse em um padrão circular
        const angle = (step % 360) * (Math.PI / 180);
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        
        element.style.setProperty('--mouse-x', `${x}%`);
        element.style.setProperty('--mouse-y', `${y}%`);
        
        step += 1;
      }, 50);
    };

    // Iniciar o efeito de pulso automaticamente
    startPulseEffect();

    // Adicionar listeners para quando o mouse entra/sai do elemento
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseenter', () => {
      // Parar o efeito automático quando o mouse entra
      clearInterval(interval);
    });
    element.addEventListener('mouseleave', () => {
      // Reiniciar o efeito automático quando o mouse sai
      startPulseEffect();
    });

    return () => {
      // Limpar event listeners quando o componente é desmontado
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseenter', () => clearInterval(interval));
      element.removeEventListener('mouseleave', startPulseEffect);
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      ref={titleRef} 
      className={`welcome-title-animation ${className}`}
    >
      {children}
    </div>
  );
};

export default WelcomeTitleEffect; 