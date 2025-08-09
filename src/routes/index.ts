import { Router } from 'express';
import quotationsRouter from './quotations';
import quotationPiecesRouter from './quotation_pieces';
import adminUsersRouter from './admin_users';
import companySettingsRouter from './company_settings';
import formFieldsRouter from './form_fields';
import pdfTemplatesRouter from './pdf_templates';
import quotationFilesRouter from './quotation_files';
import materialOptionsRouter from './material_options';
import sinkOptionsRouter from './sink_options';
import pricingRulesRouter from './pricing_rules';
import activityLogsRouter from './activity_logs';
import emailTemplatesRouter from './email_templates';
import systemSettingsRouter from './system_settings';
import adminRouter from './admin';
import usersRouter from './users';

const router = Router();

// Test route to verify the API is working
router.get('/', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

router.use('/quotations', quotationsRouter);
router.use('/quotation_pieces', quotationPiecesRouter);
router.use('/admin_users', adminUsersRouter);
router.use('/company_settings', companySettingsRouter);
router.use('/form_fields', formFieldsRouter);
router.use('/pdf_templates', pdfTemplatesRouter);
router.use('/quotation_files', quotationFilesRouter);
router.use('/material_options', materialOptionsRouter);
router.use('/sink_options', sinkOptionsRouter);
router.use('/pricing_rules', pricingRulesRouter);
router.use('/activity_logs', activityLogsRouter);
router.use('/email_templates', emailTemplatesRouter);
router.use('/system_settings', systemSettingsRouter);
router.use('/admin', adminRouter);
router.use('/users', usersRouter);

export default router; 