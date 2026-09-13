import { useEffect, useState } from 'react';
import { fetchReportDetail, fetchReportDiff, fetchReports } from '../api/reports-api';
import { Modal } from '../components/ui/modal';
import { formatRunStatus } from '../lib/ui-labels';
import { useToast } from '../hooks/use-toast';
import type { MockReportDetail } from '../data/mock-reports';
import type { ReportDiff, ReportSummary } from '../types/api-types';

export function ReportsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'history' | 'diff'>('history');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [detailReport, setDetailReport] = useState<MockReportDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
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
        setError(requestError instanceof Error ? requestError.message : '無法載入報表');
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
        setError(requestError instanceof Error ? requestError.message : '無法載入比對資料');
      }
    };
    void loadDiff();
  }, [activeTab, selectedReportId]);

  const openDetail = async (reportId: string) => {
    try {
      const detail = await fetchReportDetail(reportId);
      setDetailReport(detail);
      setDetailOpen(true);
    } catch {
      showToast('無法載入報告詳情', 'error');
    }
  };

  const handleExport = () => {
    showToast('報告已匯出（展示模式）', 'success');
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>報表與視覺比對</h1>
          <p>檢視測試歷史並比對截圖差異。</p>
        </div>
        <div className="toolbar">
          <div className="tab-row">
            <button
              type="button"
              className={activeTab === 'history' ? 'tab tab--active' : 'tab'}
              onClick={() => setActiveTab('history')}
            >
              測試歷史
            </button>
            <button
              type="button"
              className={activeTab === 'diff' ? 'tab tab--active' : 'tab'}
              onClick={() => setActiveTab('diff')}
            >
              截圖比對
            </button>
          </div>
          <button type="button" className="btn btn--secondary" onClick={handleExport}>
            匯出報表
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
                  <th>日期</th>
                  <th>模板</th>
                  <th>通過</th>
                  <th>失敗</th>
                  <th>操作</th>
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
                      <button type="button" className="btn btn--ghost" onClick={() => void openDetail(run.id)}>
                        詳情
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          setSelectedReportId(run.id);
                          setActiveTab('diff');
                        }}
                      >
                        查看比對
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
              差異 {diff?.diff_score ?? 0}%
            </span>
            <span>
              {diff?.baseline_label ?? '基準版'} / {diff?.candidate_label ?? '候選版'}
            </span>
          </div>

          <div className="diff-viewport">
            <div className="diff-image diff-image--baseline diff-image--mock-a">
              <span>{diff?.baseline_label ?? '基準版截圖'}</span>
            </div>
            <div
              className="diff-image diff-image--current diff-image--mock-b"
              style={{ clipPath: `inset(0 0 0 ${sliderValue}%)` }}
            >
              <span>{diff?.candidate_label ?? '候選版截圖'}</span>
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
          <p className="diff-overlay-note">拖曳滑桿比對基準版與候選版（展示模式使用示意背景）</p>
        </section>
      )}

      <Modal open={detailOpen} title={detailReport?.template ?? '報表詳情'} onClose={() => setDetailOpen(false)}>
        {detailReport ? (
          <>
            <dl className="meta-list meta-list--stacked">
              <div><dt>日期</dt><dd>{detailReport.date}</dd></div>
              <div><dt>通過</dt><dd>{detailReport.pass_count}</dd></div>
              <div><dt>失敗</dt><dd>{detailReport.fail_count}</dd></div>
            </dl>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>裝置</th>
                    <th>狀態</th>
                    <th>備註</th>
                  </tr>
                </thead>
                <tbody>
                  {detailReport.devices.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{formatRunStatus(row.status)}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
