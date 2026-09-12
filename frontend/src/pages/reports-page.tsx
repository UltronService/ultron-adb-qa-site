import { useEffect, useState } from 'react';
import { fetchReportDiff, fetchReports } from '../api/reports-api';
import type { ReportDiff, ReportSummary } from '../types/api-types';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'history' | 'diff'>('history');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [diff, setDiff] = useState<ReportDiff | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchReports();
        setReports(result);
        if (result[0]) {
          setSelectedReportId(result[0].id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load reports');
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selectedReportId || activeTab !== 'diff') {
      return;
    }

    const loadDiff = async () => {
      try {
        const result = await fetchReportDiff(selectedReportId);
        setDiff(result);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to load diff');
      }
    };
    void loadDiff();
  }, [activeTab, selectedReportId]);

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

      {error && <p className="page-footer">{error}</p>}

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
                  <th>Diff</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((run) => (
                  <tr key={run.id}>
                    <td>{run.date}</td>
                    <td>{run.template}</td>
                    <td>{run.pass_count}</td>
                    <td>{run.fail_count}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          setSelectedReportId(run.id);
                          setActiveTab('diff');
                        }}
                      >
                        View diff
                      </button>
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
            <span className="badge badge--warn">
              Diff {diff?.diff_score ?? 0}%
            </span>
            <span>
              {diff?.baseline_label ?? 'Baseline'} / {diff?.candidate_label ?? 'Current'}
            </span>
          </div>

          <div className="diff-viewport">
            <div className="diff-image diff-image--baseline">
              <span>{diff?.baseline_label ?? 'Baseline screenshot'}</span>
            </div>
            <div
              className="diff-image diff-image--current"
              style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
            >
              <span>{diff?.candidate_label ?? 'Current screenshot'}</span>
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
        </section>
      )}
    </section>
  );
}
