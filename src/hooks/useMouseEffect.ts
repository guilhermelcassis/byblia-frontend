import { useEffect } from 'react';

/**
 * Hook para adicionar efeito de brilho gradiente nos elementos input-box-3d
 * baseado na posição do mouse
 */
export const useMouseEffect = (): void => {
  useEffect(() => {
    // Verificar se é um dispositivo touch
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Não aplicar efeito em dispositivos touch
    if (isTouchDevice) return;
    
    // Função para atualizar o efeito gradiente nos elementos .input-box-3d
    const updateInputBoxEffect = (e: MouseEvent) => {
      // Selecionar todos os elementos com a classe input-box-3d
      const elements = document.querySelectorAll('.input-box-3d');
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        
        // Verificar se o mouse está próximo ao elemento (até 150px de distância)
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );
        
        // Se o mouse estiver próximo, calcular a posição relativa
        if (distance < 250) {
          // Quanto mais perto, mais forte o efeito
          const intensity = 1 - Math.min(distance / 250, 1);
          
          // Adicionar uma classe para aplicar o efeito
          el.classList.add('mouse-nearby');
          
          // Calcular a posição relativa do mouse
          const x = ((mouseX - rect.left) / rect.width) * 100;
          const y = ((mouseY - rect.top) / rect.height) * 100;
          
          // Aplicar transformação sutil
          (el as HTMLElement).style.transform = `
            perspective(1000px) 
            rotateX(${(centerY - mouseY) * 0.01 * intensity}deg) 
            rotateY(${(mouseX - centerX) * 0.01 * intensity}deg)
            translateY(-${2 * intensity}px)
          `;
          
          // Aplicar posição do gradiente
          (el as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
          (el as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
          (el as HTMLElement).style.setProperty('--intensity', intensity.toString());
        } else {
          // Remover efeito quando o mouse está longe
          el.classList.remove('mouse-nearby');
          (el as HTMLElement).style.transform = '';
        }
      });
    };
    
    // Adicionar evento de mousemove ao documento
    document.addEventListener('mousemove', updateInputBoxEffect);
    
    // Limpar evento ao desmontar
    return () => {
      document.removeEventListener('mousemove', updateInputBoxEffect);
    };
  }, []);
}; 