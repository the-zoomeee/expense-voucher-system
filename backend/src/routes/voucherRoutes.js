const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/voucherController');

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('employee'), upload.single('employeeSignature'), ctrl.createVoucher);
router.put('/:id', authorize('employee'), upload.single('employeeSignature'), ctrl.updateVoucher);
router.delete('/:id', authorize('employee'), ctrl.deleteVoucher);
router.post('/:id/submit', authorize('employee'), ctrl.submitVoucher);
router.get('/mine', authorize('employee'), ctrl.getMyVouchers);

router.get('/pending', authorize('director'), ctrl.getPendingVouchers);
router.post('/:id/approve', authorize('director'), upload.single('directorSignature'), ctrl.approveVoucher);
router.post('/:id/reject', authorize('director'), ctrl.rejectVoucher);

router.get('/dashboard/employee', authorize('employee'), ctrl.getEmployeeDashboard);
router.get('/dashboard/director', authorize('director'), ctrl.getDirectorDashboard);
router.get('/dashboard/accounts', authorize('accounts'), ctrl.getAccountsDashboard);

router.get('/', authorize('director', 'accounts'), ctrl.getAllVouchers);

router.get('/:id/history', ctrl.getVoucherHistory);
router.get('/:id', ctrl.getVoucherById);

module.exports = router;