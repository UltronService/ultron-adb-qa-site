import { useState } from 'react';

const MOCK_HISTORY = [
  { id: 'run-1', date: '2026-09-11 16:00', template: 'Cold start time', pass: 2, fail: 1 },
  { id: 'run-2', date: '2026-09-10 11:20', template: 'Monkey stress', pass: 3, fail: 0 },
  { id: 'run-3', date: '2026-09-09 09:45', template: 'Long playback', pass: 1, fail: 2 },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'diff'>('history');
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Reports & Visual Diff</h1>
          <p>Review test history and compare screenshots.</p>
        </div>
        <div className="tab-row">
          <button
            type="button"
            className={activeTab === 'history' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('history')}
          >
            Test History
          </button>
          <button
            type="button"
            className={activeTab === 'diff' ? 'tab tab--active' : 'tab'}
            onClick={() => setActiveTab('diff')}
          >
            Screenshot Diff
          </button>
        </div>
      </header>

      {activeTab === 'history' ? (
        <section className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Template</th>
                  <th>Pass</th>
                  <th>Fail</th>
                  <th>Export</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_HISTORY.map((run) => (
                  <tr key={run.id}>
                    <td>{run.date}</td>
                    <td>{run.template}</td>
                    <td>{run.pass}</td>
                    <td>{run.fail}</td>
                    <td>
                      <button type="button" className="btn btn--ghost">PDF</button>
                      <button type="button" className="btn btn--ghost">HTML</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="panel diff-panel">
          <div className="diff-header">
            <span className="badge badge--warn">Diff 3.8%</span>
            <span>Baseline: v2.0.3 / Current: v2.1.0</span>
          </div>

          <div className="diff-viewport">
            <div className="diff-image diff-image--baseline">
              <span>Baseline screenshot</span>
            </div>
            <div
              className="diff-image diff-image--current"
              style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
            >
              <span>Current screenshot</span>
            </div>
            <input
              className="diff-slider"
              max={100}
              min={0}
              type="range"
              value={sliderValue}
              onChange={(event) => setSliderValue(Number(event.target.value))}
            />
          </div>

          <div className="diff-overlay-note">
            Difference pixels highlighted in red overlay (mock)
          </div>

          <div className="toolbar">
            <button type="button" className="btn btn--primary">Approve (Pass)</button>
            <button type="button" className="btn btn--danger">Mark Bug</button>
            <button type="button" className="btn btn--secondary">Update Baseline</button>
          </div>
        </section>
      )}
    </section>
  );
}
