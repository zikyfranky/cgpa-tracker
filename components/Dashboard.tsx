'use client';

import { CGPAResult, Classification } from '@/lib/types';
import { VC_LIST_MIN, DEANS_LIST_MIN } from '@/lib/constants';

interface DashboardProps {
  cgpaData: CGPAResult;
  classification: Classification;
  filled: number;
  total: number;
  totalCredits: number;
}

export default function Dashboard({ cgpaData, classification, filled, total, totalCredits }: DashboardProps) {
  const isVCList = cgpaData.hasAny && cgpaData.cgpa >= VC_LIST_MIN;
  const isDeansListAny = cgpaData.hasAny && cgpaData.cgpa >= DEANS_LIST_MIN;

  return (
    <>
      <div className="dashboard">
        <div className="stat-card">
          <div className="label">Current CGPA</div>
          <div className="value cgpa-val">{cgpaData.hasAny ? cgpaData.cgpa.toFixed(2) : '—'}</div>
          <div className="sub">{cgpaData.hasAny ? 'out of 5.00' : 'No grades entered'}</div>
          {isVCList && (
            <div className="sub" style={{ color: '#00b894', fontWeight: 600, marginTop: '4px' }}>
              Vice Chancellor&apos;s List
            </div>
          )}
          {!isVCList && isDeansListAny && (
            <div className="sub" style={{ color: '#00cec9', fontWeight: 600, marginTop: '4px' }}>
              Dean&apos;s List
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="label">Classification</div>
          <div className="value class-val" style={{ color: classification.color, fontSize: '1.2rem' }}>
            {cgpaData.hasAny ? classification.label : '—'}
          </div>
          <div className="sub">
            {cgpaData.hasAny ? `${classification.min.toFixed(2)} – ${classification.max.toFixed(2)}` : 'Enter grades to see'}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Courses Filled</div>
          <div className="value">
            {filled}<span style={{ fontSize: '1rem', color: 'var(--muted)' }}>/{total}</span>
          </div>
          <div className="sub">{total - filled} remaining</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Credit Units</div>
          <div className="value">{totalCredits}</div>
          <div className="sub">Across all levels</div>
        </div>
      </div>

      {/* CGPA Progress Bar */}
      {cgpaData.hasAny && (
        <div className="progress-container">
          <div className="progress-label">
            <span>CGPA Progress</span>
            <span style={{ color: classification.color, fontWeight: 600 }}>{cgpaData.cgpa.toFixed(2)} / 5.00</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(cgpaData.cgpa / 5) * 100}%`,
                background: `linear-gradient(90deg,${classification.color},${classification.color}dd)`,
              }}
            />
          </div>
          <div className="progress-markers">
            <span>0</span>
            <span>1.50 3rd Class</span>
            <span>2.40 2:2</span>
            <span>3.50 2:1</span>
            <span>4.50 1st Class</span>
            <span>5.0</span>
          </div>
        </div>
      )}
    </>
  );
}
