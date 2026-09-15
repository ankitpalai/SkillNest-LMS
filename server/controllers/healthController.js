/**
 * Health check controller
 * @route GET /api/health
 * @desc  Verifies the LMS backend is online
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "LMS API is running"
  });
};

export default {
  getHealth
};
