import Category from '../models/Category.js';
import Course from '../models/Course.js';

/**
 * @route   GET /api/categories
 * @desc    Get all categories with associated course counts
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Aggregate course counts per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const courseCount = await Course.countDocuments({
          category: cat._id,
          status: 'published',
        });
        return {
          ...cat.toObject(),
          courseCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/categories
 * @desc    Create a new course category
 * @access  Private (Admin only)
 */
export const createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a category name',
      });
    }

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: `Category '${name}' already exists`,
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      image: image || '',
    });

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/categories/:id
 * @desc    Update an existing category
 * @access  Private (Admin only)
 */
export const updateCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    if (name) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (image !== undefined) category.image = image;

    await category.save();

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category (prevents deletion if courses exist)
 * @access  Private (Admin only)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if any courses are attached
    const attachedCourses = await Course.countDocuments({ category: req.params.id });
    if (attachedCourses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${attachedCourses} active course(s). Reassign them first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
