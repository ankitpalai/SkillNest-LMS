import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../features/courses/courseSlice';
import api from '../../services/api';

export const CourseForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { categories } = useSelector((state) => state.courses);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    price: 0,
    level: 'beginner',
    language: 'English',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    requirements: [''],
    learningObjectives: [''],
    status: 'draft',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    dispatch(fetchCategories());

    if (isEditMode) {
      setLoading(true);
      api
        .get(`/courses/${id}`)
        .then((res) => {
          const c = res.data.course;
          setFormData({
            title: c.title || '',
            subtitle: c.subtitle || '',
            description: c.description || '',
            category: c.category?._id || c.category || '',
            price: c.price !== undefined ? c.price : 0,
            level: c.level || 'beginner',
            language: c.language || 'English',
            thumbnail: c.thumbnail || '',
            requirements: c.requirements && c.requirements.length ? c.requirements : [''],
            learningObjectives:
              c.learningObjectives && c.learningObjectives.length ? c.learningObjectives : [''],
            status: c.status || 'draft',
          });
        })
        .catch((err) => {
          setErrorMsg(err.response?.data?.message || 'Failed to load course details');
        })
        .finally(() => setLoading(false));
    }
  }, [dispatch, id, isEditMode]);

  // Set default category once categories load if empty
  useEffect(() => {
    if (categories.length > 0 && !formData.category && !isEditMode) {
      setFormData((prev) => ({ ...prev, category: categories[0]._id }));
    }
  }, [categories, formData.category, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  // Dynamic Array Handlers for Requirements
  const handleRequirementChange = (idx, val) => {
    const next = [...formData.requirements];
    next[idx] = val;
    setFormData((prev) => ({ ...prev, requirements: next }));
  };

  const addRequirement = () => {
    setFormData((prev) => ({ ...prev, requirements: [...prev.requirements, ''] }));
  };

  const removeRequirement = (idx) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== idx),
    }));
  };

  // Dynamic Array Handlers for Learning Objectives
  const handleObjectiveChange = (idx, val) => {
    const next = [...formData.learningObjectives];
    next[idx] = val;
    setFormData((prev) => ({ ...prev, learningObjectives: next }));
  };

  const addObjective = () => {
    setFormData((prev) => ({ ...prev, learningObjectives: [...prev.learningObjectives, ''] }));
  };

  const removeObjective = (idx) => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (targetStatus) => {
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Please provide a course title.');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Please provide a course description.');
      return;
    }
    if (!formData.category) {
      setErrorMsg('Please select a course category.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      status: targetStatus,
      price: Number(formData.price) || 0,
      requirements: formData.requirements.filter((r) => r.trim().length > 0),
      learningObjectives: formData.learningObjectives.filter((o) => o.trim().length > 0),
    };

    try {
      if (isEditMode) {
        await api.put(`/courses/${id}`, payload);
        navigate(`/instructor/courses/${id}/curriculum`);
      } else {
        const res = await api.post('/courses', payload);
        const newCourseId = res.data.course._id;
        navigate(`/instructor/courses/${newCourseId}/curriculum`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save course');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
        <div>
          <Link
            to="/instructor/courses"
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            ← Back to My Courses
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {isEditMode ? 'Edit Course Details' : 'Create New Course'}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Fill in the course identity, pricing, and curriculum goals.
          </p>
        </div>

        {isEditMode && (
          <Link
            to={`/instructor/courses/${id}/curriculum`}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors"
          >
            Go to Curriculum Builder →
          </Link>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center space-x-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Distributed Microservices with Go & Docker"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              placeholder="e.g. Master concurrency, gRPC protocols, and Kubernetes orchestration"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:ring-1 focus:ring-primary-500 outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Difficulty Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white focus:ring-1 focus:ring-primary-500 outline-none capitalize"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Course Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a thorough overview of the topics covered, architectural concepts, and practical projects..."
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Media & Pricing */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
            2. Media & Pricing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Price (USD) <span className="text-neutral-400 font-normal">(0 = Free course)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-neutral-500 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="English"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Course Thumbnail Image
              </label>
              <label className="cursor-pointer inline-flex items-center space-x-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload to Cloudinary</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formDataUpload = new FormData();
                    formDataUpload.append('thumbnail', file);
                    try {
                      const res = await api.post('/upload/thumbnail', formDataUpload, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      if (res.data?.url) {
                        setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
                      }
                    } catch (err) {
                      setErrorMsg(err.response?.data?.message || 'Failed to upload course thumbnail');
                    }
                  }}
                />
              </label>
            </div>
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/... or upload via button above"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none font-mono text-xs"
            />
            {formData.thumbnail && (
              <div className="mt-3 flex items-center space-x-3">
                <img
                  src={formData.thumbnail}
                  alt="Thumbnail preview"
                  className="w-24 h-16 object-cover rounded border border-neutral-200"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60';
                  }}
                />
                <span className="text-[11px] text-neutral-500">Live thumbnail preview</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Learning Objectives */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                3. What Students Will Learn
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Key takeaways and competencies</p>
            </div>
            <button
              type="button"
              onClick={addObjective}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              + Add Objective
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.learningObjectives.map((obj, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs font-bold text-neutral-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={obj}
                  onChange={(e) => handleObjectiveChange(idx, e.target.value)}
                  placeholder="e.g. Master distributed caching with Redis"
                  className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
                />
                {formData.learningObjectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(idx)}
                    className="text-neutral-400 hover:text-red-600 text-xs px-2 py-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Requirements & Prerequisites */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                4. Requirements & Prerequisites
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Prior knowledge or tools required</p>
            </div>
            <button
              type="button"
              onClick={addRequirement}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              + Add Requirement
            </button>
          </div>

          <div className="space-y-2.5">
            {formData.requirements.map((req, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-xs font-bold text-neutral-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={req}
                  onChange={(e) => handleRequirementChange(idx, e.target.value)}
                  placeholder="e.g. Basic familiarity with terminal commands"
                  className="flex-1 px-3 py-1.5 text-xs border border-neutral-300 rounded-md focus:ring-1 focus:ring-primary-500 outline-none"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(idx)}
                    className="text-neutral-400 hover:text-red-600 text-xs px-2 py-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 flex items-center justify-between">
          <Link
            to="/instructor/courses"
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </Link>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-md shadow-sm transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('published')}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm transition-colors flex items-center space-x-1.5"
            >
              <span>{loading ? 'Saving...' : 'Publish Course'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
