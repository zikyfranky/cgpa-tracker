'use client';

import { GradeEntry, CGPAResult, CourseDataMap, GradedCourse, UpcomingCourse } from '@/lib/types';
import { GRADES, DEPT_NAMES, DEPT_TIPS, DEFAULT_TIP } from '@/lib/constants';
import { getClassification } from '@/lib/grading';
import { getCourseGrade, isUpcoming, passesUpcomingFilter } from '@/lib/calculations';

interface InsightsPanelProps {
  cgpaData: CGPAResult;
  grades: Record<string, GradeEntry>;
  courseData: CourseDataMap;
  currentLevel: string;
  currentSemester: string;
  upcomingFilter: string;
  onSetUpcomingFilter: (val: string) => void;
}

export default function InsightsPanel({
  cgpaData, grades, courseData, currentLevel, currentSemester,
  upcomingFilter, onSetUpcomingFilter
}: InsightsPanelProps) {
  if (!cgpaData.hasAny) {
    return (
      <div className="insights">
        <h3>&#x1f4ca; Insights &amp; Recommendations</h3>
        <div className="insight-item insight-info">
          Enter your grades for 100L and 200L to see insights and track your CGPA progress.
          You can use the level tabs above to input scores.
        </div>
      </div>
    );
  }

  const classification = getClassification(cgpaData.cgpa);

  // Collect all graded courses
  const allGraded: GradedCourse[] = [];
  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      for (const c of courseData[level].semesters[sem]) {
        const g = getCourseGrade(level, sem, c.code, grades);
        if (g) allGraded.push({ ...c, level, sem, grade: g.grade, points: g.points, desc: g.desc });
      }
    }
  }

  // Collect weak courses
  const weakCourses: (GradedCourse & { level: string; sem: string })[] = [];
  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      for (const c of courseData[level].semesters[sem]) {
        const g = getCourseGrade(level, sem, c.code, grades);
        if (g && g.points <= 2) {
          weakCourses.push({ ...c, level, sem, grade: g.grade, points: g.points, desc: g.desc });
        }
      }
    }
  }
  weakCourses.sort((a, b) => a.points - b.points || b.units - a.units);

  // Collect upcoming unfilled courses
  const allUpcoming: UpcomingCourse[] = [];
  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      if (!isUpcoming(level, sem, currentLevel, currentSemester)) continue;
      for (const c of courseData[level].semesters[sem]) {
        if (!getCourseGrade(level, sem, c.code, grades)) {
          allUpcoming.push({ ...c, level, sem });
        }
      }
    }
  }
  allUpcoming.sort((a, b) => b.units - a.units);

  // Grade distribution data
  const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  const distUnits: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  for (const c of allGraded) {
    dist[c.grade]++;
    distUnits[c.grade] += c.units;
  }

  // Department analysis
  const deptMap: Record<string, { courses: GradedCourse[]; totalPts: number; totalUnits: number }> = {};
  for (const c of allGraded) {
    let dept = c.code.replace(/^FUTM-/, '').replace(/\(.*\)/, '').replace(/[0-9]+.*$/, '');
    if (!dept) dept = 'OTHER';
    if (!deptMap[dept]) deptMap[dept] = { courses: [], totalPts: 0, totalUnits: 0 };
    deptMap[dept].courses.push(c);
    deptMap[dept].totalPts += c.points * c.units;
    deptMap[dept].totalUnits += c.units;
  }
  const depts = Object.entries(deptMap)
    .filter(([, v]) => v.courses.length >= 1)
    .map(([k, v]) => ({ code: k, name: DEPT_NAMES[k] || k, avg: v.totalPts / v.totalUnits, count: v.courses.length, units: v.totalUnits, courses: v.courses }))
    .sort((a, b) => a.avg - b.avg);

  const weakDepts = depts.filter(d => d.avg < 3.5);
  const strongDepts = depts.filter(d => d.avg >= 4.0);

  const barColors: Record<string, string> = { A: 'var(--A)', B: 'var(--B)', C: 'var(--C)', D: 'var(--D)', E: 'var(--E)', F: 'var(--F)' };
  const total = allGraded.length;

  // "What you need" targets
  const allUpcomingUnits = allUpcoming.reduce((s, c) => s + c.units, 0);
  const projectedTotalUnits = cgpaData.totalUnits + allUpcomingUnits;
  const targets = [
    { label: "First Class Honours (4.50)", cgpa: 4.50, color: "#00b894" },
    { label: "Second Class Honours Upper Division (3.50)", cgpa: 3.50, color: "#00cec9" },
    { label: "Second Class Honours Lower Division (2.40)", cgpa: 2.40, color: "#fdcb6e" },
    { label: "Third Class Honours (1.50)", cgpa: 1.50, color: "#e17055" },
  ].filter(t => t.cgpa > cgpaData.cgpa);

  // Upcoming filter options
  const seenLevels = new Set<string>();
  const filterOptionElements: React.ReactElement[] = [
    <option key="all" value="all" defaultValue={upcomingFilter === 'all' ? 'all' : undefined}>All Upcoming</option>,
  ];
  for (const c of allUpcoming) {
    if (!seenLevels.has(c.level)) {
      seenLevels.add(c.level);
      const sess = courseData[c.level].session;
      filterOptionElements.push(
        <option key={c.level} value={c.level}>{c.level}L — All ({sess})</option>
      );
      for (const sem of Object.keys(courseData[c.level].semesters)) {
        if (!isUpcoming(c.level, sem, currentLevel, currentSemester)) continue;
        const hasCourses = courseData[c.level].semesters[sem].some(cc => !getCourseGrade(c.level, sem, cc.code, grades));
        if (!hasCourses) continue;
        const val = c.level + '|' + sem;
        const semShort = sem === 'First Semester' ? '1st Sem' : '2nd Sem';
        filterOptionElements.push(
          <option key={val} value={val}>&nbsp;&nbsp;&nbsp;{c.level}L {semShort}</option>
        );
      }
    }
  }

  const filtered = allUpcoming.filter(c => passesUpcomingFilter(c.level, c.sem, upcomingFilter));
  const filteredUnits = filtered.reduce((s, c) => s + c.units, 0);

  const groups = [
    { label: "HIGH IMPACT (3 units) — prioritise these", color: "var(--highlight)", courses: filtered.filter(c => c.units >= 3) },
    { label: "MEDIUM IMPACT (2 units)", color: "var(--warning)", courses: filtered.filter(c => c.units === 2) },
    { label: "LOWER IMPACT (1 unit)", color: "var(--muted)", courses: filtered.filter(c => c.units === 1) },
  ].filter(g => g.courses.length > 0);

  return (
    <div className="insights">
      <h3>&#x1f4ca; Insights &amp; Recommendations</h3>

      {/* Classification insight */}
      {cgpaData.cgpa >= 4.5 && (
        <div className="insight-item insight-good">
          You&apos;re on track for <strong>First Class Honours</strong> and the <strong>Vice Chancellor&apos;s List</strong>. Keep maintaining high scores across all courses to hold this position.
        </div>
      )}
      {cgpaData.cgpa >= 4.0 && cgpaData.cgpa < 4.5 && (
        <div className="insight-item insight-good">
          You&apos;re in <strong>Second Class Honours (Upper Division)</strong> and qualify for the <strong>Dean&apos;s List</strong>. You need {(4.5 - cgpaData.cgpa).toFixed(2)} more CGPA points to reach First Class. Focus on scoring A&apos;s (70+) in your remaining courses.
        </div>
      )}
      {cgpaData.cgpa >= 3.5 && cgpaData.cgpa < 4.0 && (
        <div className="insight-item insight-good">
          You&apos;re in <strong>Second Class Honours (Upper Division)</strong> territory. You need {(4.0 - cgpaData.cgpa).toFixed(2)} more CGPA points to make the Dean&apos;s List (4.00+). Push for A&apos;s and B&apos;s in remaining courses.
        </div>
      )}
      {cgpaData.cgpa >= 2.4 && cgpaData.cgpa < 3.5 && (
        <div className="insight-item insight-warn">
          You&apos;re currently at <strong>Second Class Honours (Lower Division)</strong>. To move up to Upper Division (3.50+), aim for mostly B&apos;s and A&apos;s (60+) in your 300L courses.
        </div>
      )}
      {cgpaData.cgpa >= 1.5 && cgpaData.cgpa < 2.4 && (
        <div className="insight-item insight-bad">
          You&apos;re at <strong>Third Class Honours</strong>. Focus on scoring at least C (50+) in all courses and push for B&apos;s wherever possible to climb to 2:2 (2.40+).
        </div>
      )}
      {cgpaData.cgpa < 1.5 && (
        <div className="insight-item insight-bad">
          Your CGPA needs urgent attention. You must raise it above 1.50 to qualify for Third Class Honours at minimum. Target C grades (50+) across all remaining courses.
        </div>
      )}

      {/* Grade Distribution */}
      {allGraded.length > 0 && (
        <div className="insight-item insight-info">
          <strong>Grade Distribution ({total} courses graded):</strong><br /><br />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {GRADES.map(g => {
              const count = dist[g.grade];
              const units = distUnits[g.grade];
              const pct = total > 0 ? (count / total * 100) : 0;
              return (
                <div key={g.grade} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <span style={{ width: '18px', fontWeight: 700, color: barColors[g.grade] }}>{g.grade}</span>
                  <div style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColors[g.grade], borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ width: '80px', textAlign: 'right', color: 'var(--muted)', fontSize: '0.8rem' }}>{count} ({units} units)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Department Analysis */}
      {allGraded.length >= 3 && depts.length > 1 && (
        <div className="insight-item insight-info">
          <strong>Performance by Subject Area:</strong><br /><br />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>Department</th>
                  <th style={{ textAlign: 'center', padding: '6px', color: 'var(--muted)' }}>Courses</th>
                  <th style={{ textAlign: 'center', padding: '6px', color: 'var(--muted)' }}>Units</th>
                  <th style={{ textAlign: 'center', padding: '6px', color: 'var(--muted)' }}>Avg GPA</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>Assessment</th>
                </tr>
              </thead>
              <tbody>
                {depts.map(d => {
                  const dColor = getClassification(d.avg).color;
                  const assessment = d.avg >= 4.5 ? 'Excellent' : d.avg >= 3.5 ? 'Strong' : d.avg >= 3.0 ? 'Fair' : d.avg >= 2.0 ? 'Needs work' : 'Struggling';
                  return (
                    <tr key={d.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '5px 8px' }}><strong>{d.code}</strong> <span style={{ color: 'var(--muted)' }}>({d.name})</span></td>
                      <td style={{ textAlign: 'center', padding: '5px' }}>{d.count}</td>
                      <td style={{ textAlign: 'center', padding: '5px' }}>{d.units}</td>
                      <td style={{ textAlign: 'center', padding: '5px', fontWeight: 700, color: dColor }}>{d.avg.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', color: dColor }}>{assessment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {weakDepts.length > 0 && (
            <>
              <br /><strong style={{ color: 'var(--warning)' }}>Areas to improve:</strong><br />
              {weakDepts.map(d => {
                const weakCs = d.courses.filter(c => c.points <= 2).sort((a, b) => a.points - b.points);
                const tip = DEPT_TIPS[d.code] || DEFAULT_TIP;
                return (
                  <div key={d.code} style={{ margin: '6px 0', padding: '8px 12px', background: 'rgba(253,203,110,0.08)', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{d.code} ({d.name}) — avg {d.avg.toFixed(2)}:</span> {tip}
                    {weakCs.length > 0 && (
                      <><br /><span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Weakest: {weakCs.map(c => c.code + ' (' + c.grade + ')').join(', ')}</span></>
                    )}
                  </div>
                );
              })}
            </>
          )}
          {strongDepts.length > 0 && (
            <>
              <br /><strong style={{ color: 'var(--success)' }}>Your strengths:</strong><br />
              {strongDepts.map(d => (
                <span key={d.code} style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
                  {d.code} ({d.name}) — avg {d.avg.toFixed(2)}: Keep it up! This is boosting your CGPA.<br />
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Weak Courses + Improvement Impact */}
      {weakCourses.length > 0 ? (
        <div className="insight-item insight-warn">
          <strong>Courses pulling your CGPA down:</strong><br />
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Shows how much your CGPA would improve if you scored higher (e.g. on a retake).</span><br /><br />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px', color: 'var(--muted)' }}>Course</th>
                  <th style={{ textAlign: 'center', padding: '5px', color: 'var(--muted)' }}>Units</th>
                  <th style={{ textAlign: 'center', padding: '5px', color: 'var(--muted)' }}>Now</th>
                  <th style={{ textAlign: 'center', padding: '5px', color: 'var(--A)' }}>If A</th>
                  <th style={{ textAlign: 'center', padding: '5px', color: 'var(--B)' }}>If B</th>
                  <th style={{ textAlign: 'center', padding: '5px', color: 'var(--C)' }}>If C</th>
                </tr>
              </thead>
              <tbody>
                {weakCourses.map(wc => {
                  return (
                    <tr key={wc.code + wc.level + wc.sem} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '5px 8px' }}>
                        <span style={{ color: 'var(--highlight)', fontWeight: 600, fontSize: '0.8rem' }}>{wc.code}</span>{' '}
                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{wc.title}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '5px', fontWeight: 600 }}>{wc.units}</td>
                      <td style={{ textAlign: 'center', padding: '5px', color: 'var(--highlight)', fontWeight: 700 }}>{wc.grade} ({wc.points})</td>
                      {[5, 4, 3].map(targetPts => {
                        if (targetPts <= wc.points) {
                          return <td key={targetPts} style={{ textAlign: 'center', padding: '5px', color: 'var(--muted)' }}>—</td>;
                        }
                        const gainedQP = (targetPts - wc.points) * wc.units;
                        const newCGPA = (cgpaData.totalQP + gainedQP) / cgpaData.totalUnits;
                        const delta = newCGPA - cgpaData.cgpa;
                        return (
                          <td key={targetPts} style={{ textAlign: 'center', padding: '5px', color: 'var(--success)', fontWeight: 500 }}>
                            +{delta.toFixed(3)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {weakCourses.filter(c => c.grade === 'F').length > 0 && (
            <><br /><span style={{ color: 'var(--highlight)', fontSize: '0.85rem' }}>
              <strong>{weakCourses.filter(c => c.grade === 'F').length} failed course(s)</strong> — these contribute 0 points but still count as registered units, dragging your CGPA down significantly. Retaking with even a C would make a big difference.
            </span></>
          )}
          {weakCourses.filter(c => c.grade === 'E').length > 0 && (
            <><br /><span style={{ color: 'var(--D)', fontSize: '0.85rem' }}>
              <strong>{weakCourses.filter(c => c.grade === 'E').length} course(s) with E (Poor)</strong> — barely passing. Per the handbook, you cannot carry over E grades, but improving these in future related courses will strengthen your foundation.
            </span></>
          )}
          {weakCourses.filter(c => c.grade === 'D').length > 0 && (
            <><br /><span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
              <strong>{weakCourses.filter(c => c.grade === 'D').length} course(s) with D (Fair)</strong> — these are passing but below average. Focus on understanding the fundamentals you missed here.
            </span></>
          )}
        </div>
      ) : allGraded.length > 0 ? (
        <div className="insight-item insight-good">
          <strong>No weak courses (D/E/F).</strong> All your graded courses are C or above — solid foundation. To push your CGPA higher, focus on converting C&apos;s to B&apos;s and B&apos;s to A&apos;s in upcoming courses.
        </div>
      ) : null}

      {/* What you need + Per-course impact */}
      {allUpcoming.length > 0 && targets.length > 0 && (
        <div className="insight-item insight-info">
          <strong>What you need in your {allUpcoming.length} upcoming courses ({allUpcomingUnits} credit units, {currentLevel}L onward):</strong><br /><br />
          {targets.map(t => {
            const qpNeeded = (t.cgpa * projectedTotalUnits) - cgpaData.totalQP;
            const avgPtsNeeded = qpNeeded / allUpcomingUnits;
            if (avgPtsNeeded > 5) {
              return <span key={t.label} style={{ color: t.color }}><strong>{t.label}:</strong> Not achievable — would need above 5.0 avg points per unit.<br /></span>;
            } else if (avgPtsNeeded <= 0) {
              return <span key={t.label} style={{ color: t.color }}><strong>{t.label}:</strong> Already secured even with all F&apos;s.<br /></span>;
            } else {
              const gradeNeeded = avgPtsNeeded >= 4.5 ? 'A (70+)' : avgPtsNeeded >= 3.5 ? 'B (60+)' : avgPtsNeeded >= 2.5 ? 'C (50+)' : avgPtsNeeded >= 1.5 ? 'D (45+)' : 'E (40+)';
              return <span key={t.label} style={{ color: t.color }}><strong>{t.label}:</strong> Average <strong>{avgPtsNeeded.toFixed(2)} pts/unit</strong> needed → aim for grade <strong>{gradeNeeded}</strong> across remaining courses.<br /></span>;
            }
          })}
        </div>
      )}

      {/* Per-course grade impact */}
      {allUpcoming.length > 0 && (
        <div className="insight-item insight-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <strong>CGPA impact per grade — {filtered.length} courses ({filteredUnits} units)</strong>
            <select className="grade-select" style={{ fontSize: '0.82rem', padding: '5px 10px' }} value={upcomingFilter} onChange={(e) => onSetUpcomingFilter(e.target.value)}>
              {filterOptionElements}
            </select>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Shows how each grade would shift your CGPA from its current value.</span><br /><br />

          {groups.length === 0 && (
            <span style={{ color: 'var(--muted)' }}>No unfilled courses in this selection.</span>
          )}

          {groups.map(group => (
            <div key={group.label}>
              <span style={{ color: group.color }}><strong>{group.label}:</strong></span><br />
              <div style={{ overflowX: 'auto', margin: '8px 0 16px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)', fontWeight: 500 }}>Course</th>
                      <th style={{ textAlign: 'left', padding: '6px 4px', color: 'var(--muted)', fontWeight: 500 }}>Units</th>
                      {GRADES.map(g => (
                        <th key={g.grade} style={{ textAlign: 'center', padding: '6px 4px', color: barColors[g.grade], fontWeight: 600 }}>{g.grade}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.courses.map(c => (
                      <tr key={c.code + c.level + c.sem} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--highlight)', fontWeight: 600, fontSize: '0.78rem' }}>{c.code}</span>{' '}
                          <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{c.title}</span>
                        </td>
                        <td style={{ padding: '5px 4px', textAlign: 'center', fontWeight: 600 }}>{c.units}</td>
                        {GRADES.map(g => {
                          const newQP = cgpaData.totalQP + (g.points * c.units);
                          const newUnits = cgpaData.totalUnits + c.units;
                          const newCGPA = newQP / newUnits;
                          const delta = newCGPA - cgpaData.cgpa;
                          const sign = delta >= 0 ? '+' : '';
                          const color = delta > 0.01 ? 'var(--A)' : delta > 0 ? 'var(--B)' : delta > -0.01 ? 'var(--warning)' : 'var(--highlight)';
                          return (
                            <td key={g.grade} style={{ textAlign: 'center', padding: '5px 4px', color, fontWeight: 500, fontSize: '0.8rem' }}>
                              {sign}{delta.toFixed(3)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
