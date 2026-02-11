'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  code: string;
  title: string;
  units: number;
  sortOrder: number;
}

interface Semester {
  id: number;
  semesterName: string;
  maxUnits: number;
  courses: Course[];
}

interface Level {
  id: number;
  levelNumber: number;
  sessionName: string;
  semesters: Semester[];
}

interface AuthResponse {
  authenticated: boolean;
  role?: string;
  matricNumber?: string;
  userId?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingCourseData, setEditingCourseData] = useState({
    code: '',
    title: '',
    units: 0,
  });
  const [addingToSemesterId, setAddingToSemesterId] = useState<number | null>(null);
  const [newCourseData, setNewCourseData] = useState({
    code: '',
    title: '',
    units: 0,
  });
  const [expandedLevelId, setExpandedLevelId] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!newPassword || newPassword.length < 3) {
      setPasswordMsg('Password must be at least 3 characters.');
      return;
    }
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      setPasswordMsg('Password changed successfully!');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg(null);
      }, 1500);
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Error changing password');
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data: AuthResponse = await res.json();

        if (!data.authenticated || data.role !== 'admin') {
          router.push('/');
          return;
        }

        // Fetch courses
        const coursesRes = await fetch('/api/admin/courses');
        if (!coursesRes.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await coursesRes.json();
        setLevels(coursesData.levels);
        setExpandedLevelId(coursesData.levels[0]?.id || null);
      } catch (err) {
        console.error('Auth or fetch error:', err);
        setError(err instanceof Error ? err.message : 'Error loading data');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleUpdateCourse = async (courseId: number) => {
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          ...editingCourseData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update course');
      }

      // Refresh courses
      const coursesRes = await fetch('/api/admin/courses');
      const coursesData = await coursesRes.json();
      setLevels(coursesData.levels);
      setEditingCourseId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating course');
    }
  };

  const handleAddCourse = async (semesterId: number) => {
    try {
      if (!newCourseData.code.trim() || !newCourseData.title.trim() || newCourseData.units <= 0) {
        setError('Please fill in all fields');
        return;
      }

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semesterId,
          code: newCourseData.code.trim(),
          title: newCourseData.title.trim(),
          units: newCourseData.units,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add course');
      }

      // Refresh courses
      const coursesRes = await fetch('/api/admin/courses');
      const coursesData = await coursesRes.json();
      setLevels(coursesData.levels);
      setAddingToSemesterId(null);
      setNewCourseData({ code: '', title: '', units: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding course');
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete course');
      }

      // Refresh courses
      const coursesRes = await fetch('/api/admin/courses');
      const coursesData = await coursesRes.json();
      setLevels(coursesData.levels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting course');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'var(--text)',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'var(--bg)',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <a
          href="/"
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '15px',
            display: 'inline-block',
          }}
        >
          ← Back to Home
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: 'var(--text)', margin: '10px 0 5px 0' }}>
              Course Administration
            </h1>
            <p style={{ color: 'var(--muted)', margin: '0', fontSize: '14px' }}>
              Manage courses, units, and course details
            </p>
          </div>
          <button
            onClick={() => { setShowPasswordModal(true); setNewPassword(''); setPasswordMsg(null); }}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(233, 69, 96, 0.1)',
            color: 'var(--highlight)',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid var(--highlight)',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '10px',
              background: 'none',
              border: 'none',
              color: 'var(--highlight)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Levels */}
      <div>
        {levels.map((level) => (
          <div
            key={level.id}
            style={{
              marginBottom: '20px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Level header */}
            <button
              onClick={() =>
                setExpandedLevelId(expandedLevelId === level.id ? null : level.id)
              }
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--card)',
                border: 'none',
                borderBottom:
                  expandedLevelId === level.id ? '1px solid var(--border)' : 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  'rgba(15, 52, 96, 0.3)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--card)';
              }}
            >
              <span>Level {level.levelNumber} - {level.sessionName}</span>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                }}
              >
                {expandedLevelId === level.id ? '▼' : '▶'}
              </span>
            </button>

            {/* Level content */}
            {expandedLevelId === level.id && (
              <div style={{ padding: '16px' }}>
                {level.semesters.map((semester) => (
                  <div
                    key={semester.id}
                    style={{
                      marginBottom: '20px',
                      paddingBottom: '20px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {/* Semester header */}
                    <div
                      style={{
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            color: 'var(--text)',
                            margin: '0 0 4px 0',
                            fontSize: '15px',
                          }}
                        >
                          {semester.semesterName}
                        </h3>
                        <p
                          style={{
                            color: 'var(--muted)',
                            margin: '0',
                            fontSize: '12px',
                          }}
                        >
                          Max Units: {semester.maxUnits}
                        </p>
                      </div>
                      {addingToSemesterId !== semester.id && (
                        <button
                          onClick={() => {
                            setAddingToSemesterId(semester.id);
                            setNewCourseData({ code: '', title: '', units: 0 });
                          }}
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--text)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'opacity 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLButtonElement).style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLButtonElement).style.opacity = '1';
                          }}
                        >
                          + Add Course
                        </button>
                      )}
                    </div>

                    {/* Add course form */}
                    {addingToSemesterId === semester.id && (
                      <div
                        style={{
                          backgroundColor: 'rgba(15, 52, 96, 0.2)',
                          padding: '12px',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr 80px auto',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Code"
                            value={newCourseData.code}
                            onChange={(e) =>
                              setNewCourseData({
                                ...newCourseData,
                                code: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Title"
                            value={newCourseData.title}
                            onChange={(e) =>
                              setNewCourseData({
                                ...newCourseData,
                                title: e.target.value,
                              })
                            }
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Units"
                            value={newCourseData.units || ''}
                            onChange={(e) =>
                              setNewCourseData({
                                ...newCourseData,
                                units: parseInt(e.target.value) || 0,
                              })
                            }
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.05)',
                              border: '1px solid var(--border)',
                              color: 'var(--text)',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontFamily: 'inherit',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleAddCourse(semester.id)}
                              style={{
                                backgroundColor: 'var(--success)',
                                color: 'var(--bg)',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setAddingToSemesterId(null)}
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Courses table */}
                    {semester.courses.length > 0 && (
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '13px',
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              borderBottom: '1px solid var(--border)',
                              color: 'var(--muted)',
                            }}
                          >
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px 0',
                                fontWeight: '600',
                                fontSize: '12px',
                              }}
                            >
                              Code
                            </th>
                            <th
                              style={{
                                textAlign: 'left',
                                padding: '8px 0',
                                fontWeight: '600',
                                fontSize: '12px',
                              }}
                            >
                              Title
                            </th>
                            <th
                              style={{
                                textAlign: 'center',
                                padding: '8px 0',
                                fontWeight: '600',
                                fontSize: '12px',
                              }}
                            >
                              Units
                            </th>
                            <th
                              style={{
                                textAlign: 'right',
                                padding: '8px 0',
                                fontWeight: '600',
                                fontSize: '12px',
                              }}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {semester.courses.map((course) => (
                            <tr
                              key={course.id}
                              style={{
                                borderBottom: '1px solid var(--border)',
                                color: 'var(--text)',
                              }}
                            >
                              {editingCourseId === course.id ? (
                                <>
                                  <td style={{ padding: '8px 0' }}>
                                    <input
                                      type="text"
                                      value={editingCourseData.code}
                                      onChange={(e) =>
                                        setEditingCourseData({
                                          ...editingCourseData,
                                          code: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text)',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px 0' }}>
                                    <input
                                      type="text"
                                      value={editingCourseData.title}
                                      onChange={(e) =>
                                        setEditingCourseData({
                                          ...editingCourseData,
                                          title: e.target.value,
                                        })
                                      }
                                      style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text)',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                    <input
                                      type="number"
                                      value={editingCourseData.units}
                                      onChange={(e) =>
                                        setEditingCourseData({
                                          ...editingCourseData,
                                          units: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      style={{
                                        width: '60px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text)',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        fontFamily: 'inherit',
                                        textAlign: 'center',
                                      }}
                                    />
                                  </td>
                                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                    <button
                                      onClick={() =>
                                        handleUpdateCourse(course.id)
                                      }
                                      style={{
                                        backgroundColor: 'var(--success)',
                                        color: 'var(--bg)',
                                        border: 'none',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginRight: '6px',
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCourseId(null)}
                                      style={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '8px 0' }}>
                                    <span style={{ fontFamily: 'monospace' }}>
                                      {course.code}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 0' }}>
                                    {course.title}
                                  </td>
                                  <td style={{ padding: '8px 0', textAlign: 'center' }}>
                                    {course.units}
                                  </td>
                                  <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                    <button
                                      onClick={() => {
                                        setEditingCourseId(course.id);
                                        setEditingCourseData({
                                          code: course.code,
                                          title: course.title,
                                          units: course.units,
                                        });
                                      }}
                                      style={{
                                        backgroundColor: 'rgba(15, 52, 96, 0.5)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        marginRight: '6px',
                                        transition: 'opacity 0.2s',
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.target as HTMLButtonElement).style.opacity =
                                          '0.8';
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.target as HTMLButtonElement).style.opacity =
                                          '1';
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCourse(course.id)
                                      }
                                      style={{
                                        backgroundColor: 'rgba(233, 69, 96, 0.2)',
                                        color: 'var(--highlight)',
                                        border: '1px solid var(--highlight)',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        transition: 'opacity 0.2s',
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.target as HTMLButtonElement).style.opacity =
                                          '0.8';
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.target as HTMLButtonElement).style.opacity =
                                          '1';
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {semester.courses.length === 0 && (
                      <p
                        style={{
                          color: 'var(--muted)',
                          fontSize: '13px',
                          margin: '8px 0',
                        }}
                      >
                        No courses in this semester.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {levels.length === 0 && (
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'var(--muted)',
          }}
        >
          No levels or courses configured yet.
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '30px',
              width: '90%',
              maxWidth: '380px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: 'var(--text)', fontSize: '18px', marginBottom: '6px' }}>
              Change Admin Password
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '20px' }}>
              Enter a new password below.
            </p>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
              autoFocus
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '16px',
              }}
            />
            {passwordMsg && (
              <p style={{
                fontSize: '13px',
                marginBottom: '12px',
                color: passwordMsg.includes('success') ? 'var(--success)' : 'var(--highlight)',
              }}>
                {passwordMsg}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPasswordModal(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--text)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
