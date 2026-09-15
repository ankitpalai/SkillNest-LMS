import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCurriculum,
  addSection,
  updateSection,
  removeSection,
  reorderSectionsList,
  addLesson,
  updateLessonDetails,
  removeLesson,
  reorderLessonsList,
  toggleCourseStatus,
} from '../../features/instructor/instructorSlice';

export const CurriculumBuilder = () => {
  const { id: courseId } = useParams();
  const dispatch = useDispatch();
  const { curriculumCourse, sections, isCurriculumLoading, error } = useSelector(
    (state) => state.instructor
  );

  // Local UI states
  const [collapsedSections, setCollapsedSections] = useState({});
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  // Add Section form state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Lesson modal state (for add & edit)
  const [activeLessonModal, setActiveLessonModal] = useState(null); // { mode: 'create'|'edit', sectionId, lesson?: {...} }
  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: 10,
    isPreview: false,
  });

  useEffect(() => {
    if (courseId) {
      dispatch(fetchCurriculum(courseId));
    }
  }, [dispatch, courseId]);

  const toggleSectionCollapse = (secId) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  // Section actions
  const handleSaveSectionTitle = async (secId) => {
    if (!editingSectionTitle.trim()) return;
    await dispatch(updateSection({ sectionId: secId, title: editingSectionTitle }));
    setEditingSectionId(null);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    await dispatch(addSection({ courseId, title: newSectionTitle }));
    setNewSectionTitle('');
    setIsAddingSection(false);
  };

  const handleDeleteSection = async (secId) => {
    if (window.confirm('Delete this section and all associated lessons?')) {
      await dispatch(removeSection(secId));
    }
  };

  const handleMoveSection = async (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(idx, 1);
    newSections.splice(targetIdx, 0, moved);

    const sectionIds = newSections.map((s) => s._id);
    await dispatch(reorderSectionsList({ courseId, sectionIds }));
  };

  // Lesson actions
  const openCreateLessonModal = (sectionId) => {
    setLessonFormData({
      title: '',
      description: '',
      videoUrl: '',
      duration: 15,
      isPreview: false,
    });
    setActiveLessonModal({ mode: 'create', sectionId });
  };

  const openEditLessonModal = (sectionId, lesson) => {
    setLessonFormData({
      title: lesson.title || '',
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration || 0,
      isPreview: Boolean(lesson.isPreview),
    });
    setActiveLessonModal({ mode: 'edit', sectionId, lessonId: lesson._id });
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonFormData.title.trim()) return;

    if (activeLessonModal.mode === 'create') {
      await dispatch(
        addLesson({
          sectionId: activeLessonModal.sectionId,
          lessonData: lessonFormData,
        })
      );
    } else {
      await dispatch(
        updateLessonDetails({
          lessonId: activeLessonModal.lessonId,
          lessonData: lessonFormData,
        })
      );
    }

    setActiveLessonModal(null);
  };

  const handleDeleteLesson = async (sectionId, lessonId) => {
    if (window.confirm('Delete this lesson?')) {
      await dispatch(removeLesson({ sectionId, lessonId }));
    }
  };

  const handleTogglePreview = async (lesson) => {
    await dispatch(
      updateLessonDetails({
        lessonId: lesson._id,
        lessonData: { isPreview: !lesson.isPreview },
      })
    );
  };

  const handleMoveLesson = async (sectionId, lessons, idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= lessons.length) return;

    const newLessons = [...lessons];
    const [moved] = newLessons.splice(idx, 1);
    newLessons.splice(targetIdx, 0, moved);

    const lessonIds = newLessons.map((l) => l._id);
    await dispatch(reorderLessonsList({ sectionId, lessonIds }));
  };

  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.length || 0), 0);
  const totalDuration = sections.reduce(
    (sum, s) => sum + (s.lessons?.reduce((acc, l) => acc + (l.duration || 0), 0) || 0),
    0
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Course Info Header */}
      <div className="border-b border-neutral-200 pb-5">
        <div className="flex items-center justify-between">
          <Link
            to="/instructor/courses"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            ← Back to My Courses
          </Link>
          <div className="flex items-center space-x-2">
            <Link
              to={`/courses/${courseId}`}
              target="_blank"
              className="px-3 py-1 text-xs font-semibold rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              Preview Public Page ↗
            </Link>
            <button
              onClick={() => dispatch(toggleCourseStatus(courseId))}
              className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider border transition-colors ${
                curriculumCourse?.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {curriculumCourse?.status}
            </button>
          </div>
        </div>

        <div className="mt-3">
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Curriculum Builder: {curriculumCourse?.title || 'Loading Course...'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Construct sections and lessons in pedagogical sequence. Mark introductory lectures as free preview.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-neutral-600">
            <span className="font-semibold text-neutral-900">{sections.length}</span> sections
            <span>•</span>
            <span className="font-semibold text-neutral-900">{totalLessons}</span> total lessons
            <span>•</span>
            <span className="font-semibold text-neutral-900">{totalDuration}</span> mins total curriculum
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section, secIdx) => {
          const isCollapsed = collapsedSections[section._id];
          const lessons = section.lessons || [];

          return (
            <div
              key={section._id}
              className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-sm transition-all"
            >
              {/* Section Header Bar */}
              <div className="px-5 py-3.5 bg-neutral-50/80 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col space-y-0.5">
                    <button
                      onClick={() => handleMoveSection(secIdx, 'up')}
                      disabled={secIdx === 0}
                      className={`text-[10px] leading-none px-1 rounded hover:bg-neutral-200 ${
                        secIdx === 0 ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600'
                      }`}
                      title="Move section up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveSection(secIdx, 'down')}
                      disabled={secIdx === sections.length - 1}
                      className={`text-[10px] leading-none px-1 rounded hover:bg-neutral-200 ${
                        secIdx === sections.length - 1
                          ? 'text-neutral-300 cursor-not-allowed'
                          : 'text-neutral-600'
                      }`}
                      title="Move section down"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-xs font-bold text-neutral-400">Section {secIdx + 1}:</span>

                  {/* Inline Title Editing */}
                  {editingSectionId === section._id ? (
                    <div className="flex items-center space-x-2 flex-1 max-w-md">
                      <input
                        type="text"
                        value={editingSectionTitle}
                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveSectionTitle(section._id)}
                        className="flex-1 px-2.5 py-1 text-xs font-semibold text-neutral-900 border border-primary-500 rounded outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveSectionTitle(section._id)}
                        className="px-2 py-1 text-xs font-semibold bg-primary-600 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 flex-1">
                      <h2
                        onClick={() => {
                          setEditingSectionId(section._id);
                          setEditingSectionTitle(section.title);
                        }}
                        className="text-sm font-bold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors"
                        title="Click to edit section title"
                      >
                        {section.title}
                      </h2>
                      <button
                        onClick={() => {
                          setEditingSectionId(section._id);
                          setEditingSectionTitle(section.title);
                        }}
                        className="text-[11px] text-neutral-400 hover:text-neutral-700"
                        title="Edit title"
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-neutral-400 text-[11px]">
                    {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>

                  <button
                    onClick={() => toggleSectionCollapse(section._id)}
                    className="p-1 text-neutral-500 hover:text-neutral-900 font-bold"
                    title={isCollapsed ? 'Expand section' : 'Collapse section'}
                  >
                    {isCollapsed ? '▼' : '▲'}
                  </button>

                  <button
                    onClick={() => handleDeleteSection(section._id)}
                    className="text-neutral-400 hover:text-red-600 text-xs px-1"
                    title="Delete section"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Section Body (Lessons list) */}
              {!isCollapsed && (
                <div className="p-4 space-y-3 bg-white">
                  {lessons.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2 text-center">
                      No lessons added to this section yet. Click below to add your first lecture.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {lessons.map((lesson, lesIdx) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between p-3 rounded-md border border-neutral-100 bg-neutral-50/50 hover:bg-neutral-50 transition-colors text-xs"
                        >
                          {/* Lesson Info */}
                          <div className="flex items-center space-x-3 flex-1">
                            {/* Move buttons */}
                            <div className="flex flex-col space-y-0.5">
                              <button
                                onClick={() => handleMoveLesson(section._id, lessons, lesIdx, 'up')}
                                disabled={lesIdx === 0}
                                className={`text-[9px] leading-none px-1 rounded ${
                                  lesIdx === 0
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-neutral-600 hover:bg-neutral-200'
                                }`}
                              >
                                ▲
                              </button>
                              <button
                                onClick={() =>
                                  handleMoveLesson(section._id, lessons, lesIdx, 'down')
                                }
                                disabled={lesIdx === lessons.length - 1}
                                className={`text-[9px] leading-none px-1 rounded ${
                                  lesIdx === lessons.length - 1
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-neutral-600 hover:bg-neutral-200'
                                }`}
                              >
                                ▼
                              </button>
                            </div>

                            <span className="text-neutral-400 font-bold">{lesIdx + 1}.</span>

                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-neutral-900">{lesson.title}</span>
                              {lesson.duration > 0 && (
                                <span className="text-[10px] font-medium text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                                  {lesson.duration}m
                                </span>
                              )}
                              {lesson.videoUrl && (
                                <span className="text-[10px] text-blue-600 font-medium">Video</span>
                              )}
                            </div>
                          </div>

                          {/* Preview Toggle & Actions */}
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleTogglePreview(lesson)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                                lesson.isPreview
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:text-neutral-600'
                              }`}
                              title="Click to toggle Free Preview status"
                            >
                              {lesson.isPreview ? '✓ Free Preview' : '+ Set Preview'}
                            </button>

                            <button
                              onClick={() => openEditLessonModal(section._id, lesson)}
                              className="text-xs text-neutral-600 hover:text-primary-600 font-medium"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteLesson(section._id, lesson._id)}
                              className="text-xs text-neutral-400 hover:text-red-600 font-medium"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Lesson Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => openCreateLessonModal(section._id)}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <span>+</span>
                      <span>Add Lesson</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Section Box */}
        {isAddingSection ? (
          <form
            onSubmit={handleCreateSection}
            className="bg-white border border-neutral-300 rounded-lg p-4 space-y-3 shadow-sm"
          >
            <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wide">
              New Section Title
            </label>
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="e.g. Module 4: Authentication & Security Patterns"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm"
              >
                Create Section
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAddingSection(true)}
            className="w-full py-3.5 border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-lg text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2"
          >
            <span>+</span>
            <span>Add New Section</span>
          </button>
        )}
      </div>

      {/* Lesson Modal (Create / Edit) */}
      {activeLessonModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleSaveLesson}
            className="bg-white border border-neutral-200 rounded-lg p-6 max-w-lg w-full space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">
                {activeLessonModal.mode === 'create' ? 'Add New Lesson' : 'Edit Lesson Details'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLessonModal(null)}
                className="text-neutral-400 hover:text-neutral-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Lesson Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                placeholder="e.g. Async Middleware & Error Interception"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={lessonFormData.duration}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Free Preview</label>
                <label className="flex items-center space-x-2 mt-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonFormData.isPreview}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, isPreview: e.target.checked })
                    }
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-neutral-700">Allow free preview</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Video Stream URL</label>
              <input
                type="text"
                value={lessonFormData.videoUrl}
                onChange={(e) => setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })}
                placeholder="https://...mp4 or YouTube / Vimeo link"
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Lesson Notes & Summary</label>
              <textarea
                rows="3"
                value={lessonFormData.description}
                onChange={(e) =>
                  setLessonFormData({ ...lessonFormData, description: e.target.value })
                }
                placeholder="Brief summary of the concepts demonstrated in this lecture..."
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setActiveLessonModal(null)}
                className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm"
              >
                Save Lesson
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CurriculumBuilder;
