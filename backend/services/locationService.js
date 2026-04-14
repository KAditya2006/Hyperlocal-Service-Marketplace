const CommonLocation = require('../models/CommonLocation');

/**
 * Saves a landmark or public area as a common location.
 * Only saves if it's marked as global/public.
 */
const saveCommonLocation = async (locationData) => {
  const { name, area, city, pincode, coordinates, isGlobal = true } = locationData;
  
  if (!name || !coordinates) return;

  try {
    const existing = await CommonLocation.findOne({ name: name.trim() });
    if (existing) {
      existing.usageCount += 1;
      await existing.save();
      return existing;
    }

    return await CommonLocation.create({
      name: name.trim(),
      area,
      city,
      pincode,
      location: {
        type: 'Point',
        coordinates
      },
      isGlobal
    });
  } catch (error) {
    console.error('Error saving common location:', error);
  }
};

/**
 * Suggests locations based on name or area.
 */
const suggestLocations = async (query, limit = 5) => {
  if (!query) return [];

  return await CommonLocation.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { area: { $regex: query, $options: 'i' } }
    ],
    isGlobal: true
  })
  .sort({ usageCount: -1 })
  .limit(limit);
};

module.exports = {
  saveCommonLocation,
  suggestLocations
};
