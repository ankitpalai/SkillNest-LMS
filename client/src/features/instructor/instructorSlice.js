import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * Fetch aggregated instructor telemetry stats
 */
export const fetchInstructorStats = createAsyncThunk(
  'instructor/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/instructor/stats');
      return response.data.stats;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch instructor stats';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch all courses authored by the logged-in instructor
 */
export const fetchInstructorCourses = createAsyncThunk(
  'instructor/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/instructor/courses');
      return response.data.courses;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch instructor courses';
      return rejectWithValue(message);
    }
  }
);

/**
 * Toggle course status (draft <-> published)
 */
export const toggleCourseStatus = createAsyncThunk(
  'instructor/toggleCourseStatus',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/instructor/courses/${courseId}/status`);
      return { courseId, status: response.data.status };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to toggle status';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete a course
 */
export const deleteInstructorCourse = createAsyncThunk(
  'instructor/deleteCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      await api.delete(`/courses/${courseId}`);
      return courseId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete course';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch full curriculum for a course
 */
export const fetchCurriculum = createAsyncThunk(
  'instructor/fetchCurriculum',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/curriculum/course/${courseId}`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch curriculum';
      return rejectWithValue(message);
    }
  }
);

/**
 * Add a section to a course
 */
export const addSection = createAsyncThunk(
  'instructor/addSection',
  async ({ courseId, title }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/curriculum/course/${courseId}/sections`, { title });
      return response.data.section;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create section';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update section title
 */
export const updateSection = createAsyncThunk(
  'instructor/updateSection',
  async ({ sectionId, title }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/curriculum/sections/${sectionId}`, { title });
      return response.data.section;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update section';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete a section and all its lessons
 */
export const removeSection = createAsyncThunk(
  'instructor/removeSection',
  async (sectionId, { rejectWithValue }) => {
    try {
      await api.delete(`/curriculum/sections/${sectionId}`);
      return sectionId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete section';
      return rejectWithValue(message);
    }
  }
);

/**
 * Add a lesson to a section
 */
export const addLesson = createAsyncThunk(
  'instructor/addLesson',
  async ({ sectionId, lessonData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/curriculum/sections/${sectionId}/lessons`, lessonData);
      return { sectionId, lesson: response.data.lesson };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create lesson';
      return rejectWithValue(message);
    }
  }
);

/**
 * Update lesson details
 */
export const updateLessonDetails = createAsyncThunk(
  'instructor/updateLesson',
  async ({ lessonId, lessonData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/curriculum/lessons/${lessonId}`, lessonData);
      return response.data.lesson;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update lesson';
      return rejectWithValue(message);
    }
  }
);

/**
 * Delete a lesson
 */
export const removeLesson = createAsyncThunk(
  'instructor/removeLesson',
  async ({ sectionId, lessonId }, { rejectWithValue }) => {
    try {
      await api.delete(`/curriculum/lessons/${lessonId}`);
      return { sectionId, lessonId };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete lesson';
      return rejectWithValue(message);
    }
  }
);

/**
 * Reorder sections inside a course
 */
export const reorderSectionsList = createAsyncThunk(
  'instructor/reorderSections',
  async ({ courseId, sectionIds }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/curriculum/course/${courseId}/sections/reorder`, { sectionIds });
      return response.data.sections;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reorder sections';
      return rejectWithValue(message);
    }
  }
);

/**
 * Reorder lessons inside a section
 */
export const reorderLessonsList = createAsyncThunk(
  'instructor/reorderLessons',
  async ({ sectionId, lessonIds }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/curriculum/sections/${sectionId}/lessons/reorder`, { lessonIds });
      return { sectionId, lessons: response.data.lessons };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reorder lessons';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  stats: null,
  courses: [],
  curriculumCourse: null,
  sections: [],
  isLoading: false,
  isCurriculumLoading: false,
  error: null,
};

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    clearInstructorError: (state) => {
      state.error = null;
    },
    clearCurriculum: (state) => {
      state.curriculumCourse = null;
      state.sections = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stats
      .addCase(fetchInstructorStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchInstructorStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Courses
      .addCase(fetchInstructorCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchInstructorCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle Status
      .addCase(toggleCourseStatus.fulfilled, (state, action) => {
        const { courseId, status } = action.payload;
        const course = state.courses.find((c) => c._id === courseId);
        if (course) {
          course.status = status;
        }
      })

      // Delete Course
      .addCase(deleteInstructorCourse.fulfilled, (state, action) => {
        state.courses = state.courses.filter((c) => c._id !== action.payload);
      })

      // Fetch Curriculum
      .addCase(fetchCurriculum.pending, (state) => {
        state.isCurriculumLoading = true;
        state.error = null;
      })
      .addCase(fetchCurriculum.fulfilled, (state, action) => {
        state.isCurriculumLoading = false;
        state.curriculumCourse = action.payload.course;
        state.sections = action.payload.sections || [];
      })
      .addCase(fetchCurriculum.rejected, (state, action) => {
        state.isCurriculumLoading = false;
        state.error = action.payload;
      })

      // Add Section
      .addCase(addSection.fulfilled, (state, action) => {
        state.sections.push(action.payload);
      })

      // Update Section
      .addCase(updateSection.fulfilled, (state, action) => {
        const index = state.sections.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) {
          state.sections[index].title = action.payload.title;
        }
      })

      // Remove Section
      .addCase(removeSection.fulfilled, (state, action) => {
        state.sections = state.sections.filter((s) => s._id !== action.payload);
      })

      // Add Lesson
      .addCase(addLesson.fulfilled, (state, action) => {
        const { sectionId, lesson } = action.payload;
        const section = state.sections.find((s) => s._id === sectionId);
        if (section) {
          if (!section.lessons) section.lessons = [];
          section.lessons.push(lesson);
        }
      })

      // Update Lesson
      .addCase(updateLessonDetails.fulfilled, (state, action) => {
        const updated = action.payload;
        state.sections.forEach((sec) => {
          if (sec.lessons) {
            const lIdx = sec.lessons.findIndex((l) => l._id === updated._id);
            if (lIdx !== -1) {
              sec.lessons[lIdx] = updated;
            }
          }
        });
      })

      // Remove Lesson
      .addCase(removeLesson.fulfilled, (state, action) => {
        const { sectionId, lessonId } = action.payload;
        const section = state.sections.find((s) => s._id === sectionId);
        if (section && section.lessons) {
          section.lessons = section.lessons.filter((l) => l._id !== lessonId);
        }
      })

      // Reorder Sections
      .addCase(reorderSectionsList.fulfilled, (state, action) => {
        const updatedMap = new Map(action.payload.map((s) => [s._id, s.order]));
        state.sections.forEach((s) => {
          if (updatedMap.has(s._id)) {
            s.order = updatedMap.get(s._id);
          }
        });
        state.sections.sort((a, b) => a.order - b.order);
      })

      // Reorder Lessons
      .addCase(reorderLessonsList.fulfilled, (state, action) => {
        const { sectionId, lessons } = action.payload;
        const section = state.sections.find((s) => s._id === sectionId);
        if (section) {
          section.lessons = lessons;
        }
      });
  },
});

export const { clearInstructorError, clearCurriculum } = instructorSlice.actions;
export default instructorSlice.reducer;
