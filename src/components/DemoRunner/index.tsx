'use client';

import { useEffect, useState } from 'react';
import DemoRunner from './DemoRunner';

// Monta el overlay de demo SOLO cuando está habilitado explícitamente.
// Activación: añade ?demo=1 a la URL (se recuerda en localStorage para
// sobrevivir a las navegaciones). Desactivación: ?demo=0.
// Por defecto NO se muestra (no aparece en producción salvo activación manual).
export default function DemoRunnerMount() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('demo');
      if (q === '1') {
        localStorage.setItem('lt_demo_enabled', '1');
      } else if (q === '0') {
        localStorage.removeItem('lt_demo_enabled');
        localStorage.removeItem('lt_demo_runner_v1');
      }
      setEnabled(localStorage.getItem('lt_demo_enabled') === '1');
    } catch {
      setEnabled(false);
    }
  }, []);

  if (!enabled) return null;
  return <DemoRunner />;
}
