const asyncHandler = require('../utils/asyncHandler');
const contactService = require('../services/contact.service');

const getContacts = asyncHandler(async (req, res) => {
  const result = await contactService.getAll(req.query);
  res.json({
    success: true,
    data: result,
    message: 'Contacts retrieved',
  });
});

const getContact = asyncHandler(async (req, res) => {
  const contact = await contactService.getById(req.params.id);
  res.json({
    success: true,
    data: contact,
    message: 'Contact retrieved',
  });
});

const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.create(req.body);
  res.status(201).json({
    success: true,
    data: contact,
    message: 'Contact created',
  });
});

const updateContact = asyncHandler(async (req, res) => {
  const contact = await contactService.update(req.params.id, req.body);
  res.json({
    success: true,
    data: contact,
    message: 'Contact updated',
  });
});

const deleteContact = asyncHandler(async (req, res) => {
  await contactService.remove(req.params.id);
  res.json({
    success: true,
    data: null,
    message: 'Contact deleted',
  });
});

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
};
