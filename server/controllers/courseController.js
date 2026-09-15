import Course from '../models/Course.js';
import Category from '../models/Category.js';

/**
 * @route   GET /api/courses
 * @desc    Get courses with search, filtering, sorting, and pagination
 * @access  Public
 */
export const getCourses = async (req, res, next) => {
  try {
    const {
      search,
      category,
      level,
      price,
      minPrice,
      maxPrice,
      sort,
      status,
      page = 1,
      limit = 9,
    } = req.query;

    const query = {};

    // By default, public listing only returns published courses
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }

    // 1. Keyword search on title & subtitle
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { subtitle: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // 2. Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // 3. Filter by level
    if (level && level !== 'all') {
      query.level = level.toLowerCase();
    }

    // 4. Filter by price
    if (price === 'free') {
      query.price = 0;
    } else if (price === 'paid') {
      query.price = { $gt: 0 };
    } else if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // 5. Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'rating') {
      sortOptions = { rating: -1, totalReviews: -1 };
    } else if (sort === 'popular') {
      sortOptions = { enrolledStudents: -1 };
    } else if (sort === 'price-asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 };
    }

    // 6. Pagination
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 9);
    const skip = (pageNumber - 1) * limitNumber;

    const totalCourses = await Course.countDocuments(query);
    const totalPages = Math.ceil(totalCourses / limitNumber) || 1;

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar bio')
      .populate('category', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      count: courses.length,
      totalCourses,
      totalPages,
      currentPage: pageNumber,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/courses/:id
 * @desc    Get course details by ID
 * @access  Public
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar bio email')
      .populate('category', 'name description image');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Instructors & Admins only)
 */
export const createCourse = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      description,
      thumbnail,
      category,
      price,
      level,
      language,
      requirements,
      learningObjectives,
      status = 'published',
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: title, description, and category',
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'The selected category does not exist',
      });
    }

    const course = await Course.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      description,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      instructor: req.user._id, // Assign to authenticated user
      category,
      price: price !== undefined ? Number(price) : 0,
      level: level || 'beginner',
      language: language || 'English',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []),
      learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : (learningObjectives ? [learningObjectives] : []),
      status: status || 'published',
    });

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name avatar bio')
      .populate('category', 'name');

    res.status(201).json({
      success: true,
      course: populatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course details
 * @access  Private (Course Owner Instructor or Admin)
 */
export const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Ownership check: must be course instructor or an admin
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this course',
      });
    }

    // If category is being updated, verify it exists
    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'The selected category does not exist',
        });
      }
    }

    const updatableFields = [
      'title',
      'subtitle',
      'description',
      'thumbnail',
      'category',
      'price',
      'level',
      'language',
      'requirements',
      'learningObjectives',
      'status',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    const updatedCourse = await Course.findById(course._id)
      .populate('instructor', 'name avatar bio')
      .populate('category', 'name');

    res.status(200).json({
      success: true,
      course: updatedCourse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Private (Course Owner Instructor or Admin)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Ownership check
    const isOwner = course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this course',
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
