import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Obter a resposta atual
  const response = NextResponse.next();

  // Adicionar cabeçalhos de segurança
  
  // Content Security Policy mais permissiva para permitir o funcionamento correto
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://api.yourdomain.com; frame-ancestors 'none';"
  );

  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevenir detecção MIME type
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Controle de referenciador
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Relaxar o Cross-Origin Resource Policy para permitir carregamento de recursos
  // response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  
  // Habilitar proteções XSS do navegador
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Cookies seguros
  response.headers.set(
    'Set-Cookie',
    'Path=/; HttpOnly; Secure; SameSite=Strict'
  );

  return response;
}

// Aplicar middleware apenas às rotas especificadas, excluindo recursos estáticos
export const config = {
  matcher: [
    /*
     * Corresponder a todas as rotas, exceto:
     * 1. Rotas estáticas (_next/static, favicon.ico, imagens, etc)
     * 2. Rotas de API internas do Next.js (_next/data, etc)
     * 3. Chamadas de API personalizadas se você quiser excluí-las
     */
    '/((?!_next/static|_next/image|favicon.ico|biblia.svg|biblia.png|public/).*)',
  ],
}; 