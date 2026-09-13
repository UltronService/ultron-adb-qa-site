import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createScript,
  deleteScript,
  fetchScriptRunStatus,
  fetchScripts,
  runScriptTrial,
  updateScript,
} from '../api/scripts-api';
import { fetchDevices } from '../api/device-api';
import {
  REMOTE_KEY_OPTIONS,
  STEP_CATALOG,
  buildStepFromCatalog,
  type ScriptStep,
  type ScriptRunStatus,
  type TestScript,
} from '../data/script-step-catalog';
import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import type { DeviceInfo } from '../types/api-types';

interface SortableStepProps {
  step: ScriptStep;
  index: number;
  selected: boolean;
  onSelect: (stepId: string) => void;
  onRemove: (stepId: string) => void;
}

function SortableStepRow({ step, index, selected, onSelect, onRemove }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={selected ? 'script-step script-step--active' : 'script-step'}
      onClick={() => onSelect(step.id)}
    >
      <button
        type="button"
        className="script-step__handle"
        aria-label="拖曳排序"
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <span className="script-step__index">{index + 1}</span>
      <div className="script-step__body">
        <strong>{step.label}</strong>
        <span>{STEP_CATALOG.find((item) => item.action === step.action)?.toolboxLabel ?? step.action}</span>
      </div>
      <button
        type="button"
        className="btn btn--ghost script-step__remove"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(step.id);
        }}
      >
        刪除
      </button>
    </div>
  );
}

function StepEditor({
  step,
  onChange,
}: {
  step: ScriptStep;
  onChange: (updated: ScriptStep) => void;
}) {
  const updateParams = (key: string, value: string) => {
    onChange({
      ...step,
      params: { ...step.params, [key]: value },
    });
  };

  return (
    <div className="script-editor">
      <label className="field-group">
        步驟名稱
        <input
          className="input"
          value={step.label}
          onChange={(event) => onChange({ ...step, label: event.target.value })}
        />
      </label>

      {step.action === 'key' && (
        <label className="field-group">
          遙控鍵
          <select
            className="select"
            value={step.params.key ?? 'ok'}
            onChange={(event) => {
              const option = REMOTE_KEY_OPTIONS.find((item) => item.key === event.target.value);
              if (!option) {
                return;
              }
              onChange({
                ...step,
                label: `按 ${option.label}`,
                params: { key: option.key, keycode: option.keycode },
              });
            }}
          >
            {REMOTE_KEY_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </label>
      )}

      {step.action === 'wait' && (
        <label className="field-group">
          等待秒數
          <input
            className="input"
            type="number"
            min={1}
            value={step.params.seconds ?? '5'}
            onChange={(event) => {
              const seconds = event.target.value;
              onChange({
                ...step,
                label: `等待 ${seconds} 秒`,
                params: { seconds },
              });
            }}
          />
        </label>
      )}

      {step.action === 'text' && (
        <label className="field-group">
          文字內容
          <input
            className="input"
            value={step.params.text ?? ''}
            onChange={(event) => {
              const text = event.target.value;
              onChange({
                ...step,
                label: text ? `輸入「${text}」` : '輸入文字',
                params: { text },
              });
            }}
          />
        </label>
      )}

      {step.action === 'screenshot' && (
        <label className="field-group">
          截圖備註
          <input
            className="input"
            value={step.params.name ?? 'step-screenshot'}
            onChange={(event) => updateParams('name', event.target.value)}
          />
        </label>
      )}

      {step.action === 'launch' && (
        <p className="page-footer">將啟動 {ULTRON_PLAYER_APK_SOURCE.launchActivity}</p>
      )}

      {step.action === 'logcat_export' && (
        <p className="page-footer">匯出 {ULTRON_PLAYER_APK_SOURCE.packageName} 的 log</p>
      )}
    </div>
  );
}

export function ScriptsPage() {
  const [scripts, setScripts] = useState<TestScript[]>([]);
  const [activeScript, setActiveScript] = useState<TestScript | null>(null);
  const [selectedStepId, setSelectedStepId] = useState('');
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [runStatus, setRunStatus] = useState<ScriptRunStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedStep = useMemo(
    () => activeScript?.steps.find((step) => step.id === selectedStepId) ?? null,
    [activeScript, selectedStepId],
  );

  const loadData = useCallback(async () => {
    try {
      const [scriptList, deviceList] = await Promise.all([fetchScripts(), fetchDevices()]);
      setScripts(scriptList);
      setDevices(deviceList.filter((device) => device.online));
      setActiveScript((current) => current ?? scriptList[0] ?? null);
      setSelectedDeviceId((current) => current || deviceList[0]?.id || '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '載入失敗');
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!activeScript?.steps.length) {
      return;
    }
    const stillExists = activeScript.steps.some((step) => step.id === selectedStepId);
    if (!stillExists) {
      setSelectedStepId(activeScript.steps[0].id);
    }
  }, [activeScript, selectedStepId]);

  useEffect(() => {
    if (!runStatus || runStatus.state !== 'running') {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const status = await fetchScriptRunStatus(runStatus.run_id);
        setRunStatus(status);
        if (status.state !== 'running') {
          setIsRunning(false);
          setStatusMessage(
            status.state === 'completed'
              ? '試跑完成'
              : status.state === 'failed'
                ? '試跑失敗'
                : '試跑已停止',
          );
          window.clearInterval(timer);
        }
      } catch {
        setIsRunning(false);
        window.clearInterval(timer);
      }
    }, 800);

    return () => window.clearInterval(timer);
  }, [runStatus]);

  const handleSelectScript = (scriptId: string) => {
    const script = scripts.find((item) => item.id === scriptId);
    if (!script) {
      return;
    }
    setActiveScript(script);
    setSelectedStepId(script.steps[0]?.id ?? '');
    setRunStatus(null);
    setStatusMessage('');
  };

  const handleCreateScript = async () => {
    try {
      const created = await createScript('新劇本');
      setScripts((prev) => [created, ...prev]);
      setActiveScript(created);
      setSelectedStepId('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '建立失敗');
    }
  };

  const handleSaveScript = async () => {
    if (!activeScript) {
      return;
    }
    try {
      const saved = await updateScript(activeScript);
      setScripts((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      setActiveScript(saved);
      setStatusMessage('劇本已儲存');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '儲存失敗');
    }
  };

  const handleDeleteScript = async () => {
    if (!activeScript) {
      return;
    }
    try {
      await deleteScript(activeScript.id);
      const remaining = scripts.filter((item) => item.id !== activeScript.id);
      setScripts(remaining);
      setActiveScript(remaining[0] ?? null);
      setSelectedStepId(remaining[0]?.steps[0]?.id ?? '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '刪除失敗');
    }
  };

  const addStep = (catalogIndex: number) => {
    if (!activeScript) {
      return;
    }
    const catalog = STEP_CATALOG[catalogIndex];
    if (!catalog) {
      return;
    }
    const step = buildStepFromCatalog(catalog);
    const updated = {
      ...activeScript,
      steps: [...activeScript.steps, step],
    };
    setActiveScript(updated);
    setSelectedStepId(step.id);
  };

  const updateStep = (updated: ScriptStep) => {
    if (!activeScript) {
      return;
    }
    setActiveScript({
      ...activeScript,
      steps: activeScript.steps.map((step) => (step.id === updated.id ? updated : step)),
    });
  };

  const removeStep = (stepId: string) => {
    if (!activeScript) {
      return;
    }
    const nextSteps = activeScript.steps.filter((step) => step.id !== stepId);
    setActiveScript({ ...activeScript, steps: nextSteps });
    if (selectedStepId === stepId) {
      setSelectedStepId(nextSteps[0]?.id ?? '');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!activeScript) {
      return;
    }
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = activeScript.steps.findIndex((step) => step.id === active.id);
    const newIndex = activeScript.steps.findIndex((step) => step.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    setActiveScript({
      ...activeScript,
      steps: arrayMove(activeScript.steps, oldIndex, newIndex),
    });
  };

  const handleTrialRun = async () => {
    if (!activeScript || !selectedDeviceId) {
      return;
    }
    if (activeScript.steps.length === 0) {
      setError('請先加入至少一個步驟');
      return;
    }
    try {
      setError('');
      setIsRunning(true);
      setStatusMessage('試跑中…');
      const saved = await updateScript(activeScript);
      setActiveScript(saved);
      const status = await runScriptTrial(saved.id, selectedDeviceId);
      setRunStatus(status);
      if (status.state !== 'running') {
        setIsRunning(false);
        setStatusMessage(status.state === 'completed' ? '試跑完成' : '試跑結束');
      }
    } catch (requestError) {
      setIsRunning(false);
      setError(requestError instanceof Error ? requestError.message : '試跑失敗');
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>測試劇本</h1>
          <p>拖拉步驟、設定參數，並在 STB 上試跑。</p>
        </div>
        <div className="toolbar">
          <select
            className="select"
            value={activeScript?.id ?? ''}
            onChange={(event) => handleSelectScript(event.target.value)}
          >
            {scripts.map((script) => (
              <option key={script.id} value={script.id}>{script.name}</option>
            ))}
          </select>
          <button type="button" className="btn btn--ghost" onClick={() => void handleCreateScript()}>
            新增劇本
          </button>
          <select
            className="select"
            value={selectedDeviceId}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>{device.label} ({device.ip})</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--primary"
            disabled={isRunning || !activeScript}
            onClick={() => void handleTrialRun()}
          >
            {isRunning ? '試跑中…' : '試跑'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => void handleSaveScript()}>
            儲存劇本
          </button>
        </div>
      </header>

      {error && <p className="page-footer">{error}</p>}
      {statusMessage && <p className="page-footer">{statusMessage}</p>}

      <div className="scripts-layout">
        <aside className="panel scripts-toolbox">
          <h2>步驟工具箱</h2>
          <p className="page-footer">點一下加入步驟</p>
          <div className="scripts-toolbox__list">
            {STEP_CATALOG.map((item, index) => (
              <button
                key={item.action}
                type="button"
                className="btn btn--secondary scripts-toolbox__btn"
                onClick={() => addStep(index)}
              >
                + {item.toolboxLabel}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--danger"
            disabled={!activeScript}
            onClick={() => void handleDeleteScript()}
          >
            刪除劇本
          </button>
        </aside>

        <section className="panel scripts-flow">
          <div className="panel-header-row">
            <h2>劇本流程</h2>
            {activeScript && (
              <input
                className="input"
                value={activeScript.name}
                onChange={(event) =>
                  setActiveScript({ ...activeScript, name: event.target.value })
                }
              />
            )}
          </div>

          {!activeScript || activeScript.steps.length === 0 ? (
            <p className="page-footer">從左側工具箱加入第一個步驟。</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeScript.steps.map((step) => step.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="script-step-list">
                  {activeScript.steps.map((step, index) => (
                    <SortableStepRow
                      key={step.id}
                      step={step}
                      index={index}
                      selected={selectedStepId === step.id}
                      onSelect={setSelectedStepId}
                      onRemove={removeStep}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {runStatus && (
            <div className="script-run-results">
              <h3>試跑結果</h3>
              <ul>
                {runStatus.results.map((result) => (
                  <li key={result.step_index} className={`script-run-results__item script-run-results__item--${result.status}`}>
                    <span>{result.step_index + 1}. {result.step_label}</span>
                    <span>{result.status}{result.message ? ` — ${result.message}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="panel scripts-editor">
          <h2>步驟設定</h2>
          {selectedStep ? (
            <StepEditor step={selectedStep} onChange={updateStep} />
          ) : (
            <p className="page-footer">點選中間流程的步驟以編輯。</p>
          )}
        </aside>
      </div>
    </section>
  );
}
