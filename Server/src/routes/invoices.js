const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, markPaid, sendReminderNow } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoice).put(updateInvoice).delete(deleteInvoice);
router.put('/:id/mark-paid', markPaid);
router.post('/:id/send-reminder', sendReminderNow);

module.exports = router;
