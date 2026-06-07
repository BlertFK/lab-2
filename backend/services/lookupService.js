const lookupRepository = require("../repositories/lookupRepository");

const listPropertyTypes = () => lookupRepository.listPropertyTypes();

const listCategories = () => lookupRepository.listCategories();

const listCities = () => lookupRepository.listCities();

const listAmenities = () => lookupRepository.listAmenities();

module.exports = {
  listPropertyTypes,
  listCategories,
  listCities,
  listAmenities,
};
