'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildDemoFlow, DEMO_FLOW_TITLE, type DemoStep } from '@/lib/demoFlow';
import { executeStepOnDom } from './domActions';

// ============================================================
// Overlay de DEMO autoejecutable (NO es un test).
// Reproduce el flujo compartido (src/lib/demoFlow) manejando la UI real.
// Sobrevive a las navegaciones persistiendo su estado en localStorage y
// continuando automáticamente tras cada recarga.
// ============================================================

const STORAGE_KEY = 'lt_demo_runner_v1';

interface PersistedState {
  steps: DemoStep[];
  index: number;
  running: boolean;
  log: { text: string; ok: boolean }[];
}

function load(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}
function save(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function clear() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function DemoRunner() {
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
  const pausedRef = useRef(false);
  const loopActive = useRef(false);

  const persist = useCallback(
    (next: Partial<PersistedState>) => {
      const state: PersistedState = {
        steps: next.steps ?? steps,
        index: next.index ?? index,
        running: next.running ?? running,
        log: next.log ?? log
      };
      save(state);
    },
    [steps, index, running, log]
  );

  const appendLog = useCallback((text: string, ok = true) => {
    setLog((prev) => {
      const next = [...prev, { text, ok }].slice(-40);
      return next;
    });
  }, []);

  // Bucle ejecutor: corre desde `from` hasta el final o hasta una navegación.
  const runLoop = useCallback(
    async (allSteps: DemoStep[], from: number) => {
      if (loopActive.current) return;
      loopActive.current = true;
      let i = from;
      try {
        while (i < allSteps.length) {
          if (pausedRef.current) break;
          const step = allSteps[i];
          setIndex(i);
          try {
            const res = await executeStepOnDom(step);
            appendLog(`✓ ${step.description}`, true);
            i += 1;
            save({ steps: allSteps, index: i, running: true, log: [] });
            if (res.navigated) {
              // La página se va a recargar; el overlay continuará al montarse.
              return;
            }
          } catch (err) {
            appendLog(`✗ ${step.description} — ${(err as Error).message}`, false);
            pausedRef.current = true;
            setRunning(false);
            save({ steps: allSteps, index: i, running: false, log: [] });
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
        if (i >= allSteps.length) {
          appendLog('🎉 Demo completada', true);
          setRunning(false);
          save({ steps: allSteps, index: i, running: false, log: [] });
        }
      } finally {
        loopActive.current = false;
      }
    },
    [appendLog]
  );

  // Al montar: reanudar si había una demo en curso (tras una navegación).
  useEffect(() => {
    const st = load();
    if (st) {
      setSteps(st.steps);
      setIndex(st.index);
      setRunning(st.running);
      setLog(st.log ?? []);
      if (st.running && st.index < st.steps.length) {
        pausedRef.current = false;
        // pequeño respiro para que la página objetivo termine de renderizar
        setTimeout(() => runLoop(st.steps, st.index), 800);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlay() {
    let s = steps;
    let startAt = index;
    if (s.length === 0 || index >= s.length) {
      s = buildDemoFlow();
      startAt = 0;
      setSteps(s);
      setIndex(0);
      setLog([]);
    }
    pausedRef.current = false;
    setRunning(true);
    save({ steps: s, index: startAt, running: true, log: [] });
    runLoop(s, startAt);
  }

  function handlePause() {
    pausedRef.current = true;
    setRunning(false);
    persist({ running: false });
    appendLog('⏸ Pausado', true);
  }

  function handleStop() {
    pausedRef.current = true;
    setRunning(false);
    setIndex(0);
    setSteps([]);
    setLog([]);
    clear();
  }

  const total = steps.length || buildDemoFlow().length;
  const progress = Math.min(100, Math.round((index / total) * 100));
  const current = steps[index];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 max-w-[90vw] rounded-xl bg-slate-900/95 text-slate-100 shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs font-semibold">🎬 {DEMO_FLOW_TITLE}</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlay}
            disabled={running}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            ▶ Play
          </button>
          <button
            onClick={handlePause}
            disabled={!running}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 disabled:opacity-50"
          >
            ⏸ Pausa
          </button>
          <button
            onClick={handleStop}
            className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium hover:bg-red-600"
          >
            ⏹ Stop
          </button>
        </div>

        <div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Paso {Math.min(index + 1, total)} / {total} · {progress}%
          </p>
        </div>

        {current && (
          <p className="text-[11px] text-brand-200">
            {running ? '▶' : '•'} {current.description}
          </p>
        )}

        <div className="max-h-40 overflow-y-auto rounded-md bg-black/30 p-2 text-[11px] leading-snug">
          {log.length === 0 ? (
            <p className="text-slate-400">Pulsa ▶ Play para iniciar la demo guiada.</p>
          ) : (
            log.map((l, i) => (
              <p key={i} className={l.ok ? 'text-emerald-300' : 'text-red-300'}>
                {l.text}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
