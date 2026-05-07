import { Sequelize, DataTypes } from 'sequelize';

const connectionString = process.env.DATABASE_URL?.trim();

const globalForSequelize = global;

function createSequelize() {
  if (!connectionString) return null;
  return new Sequelize(connectionString, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions:
      process.env.NODE_ENV === 'production'
        ? { ssl: { rejectUnauthorized: false } }
        : {},
    logging: false
  });
}

const sequelize =
  globalForSequelize.__sequelize ?? createSequelize();

if (sequelize) {
  globalForSequelize.__sequelize = sequelize;
}

export const EmailTemplate = sequelize
  ? sequelize.define(
      'EmailTemplate',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(128), allowNull: false },
        category: { type: DataTypes.STRING(64), allowNull: false },
        prompt_template: { type: DataTypes.TEXT, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true }
      },
      { tableName: 'email_templates', timestamps: true, updatedAt: false, createdAt: 'created_at' }
    )
  : null;

export const EmailHistory = sequelize
  ? sequelize.define(
      'EmailHistory',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        recipients: { type: DataTypes.TEXT, allowNull: false },
        cc: { type: DataTypes.TEXT, allowNull: true },
        bcc: { type: DataTypes.TEXT, allowNull: true },
        subject: { type: DataTypes.TEXT, allowNull: false },
        prompt: { type: DataTypes.TEXT, allowNull: false },
        body: { type: DataTypes.TEXT, allowNull: false },
        status: {
          type: DataTypes.ENUM('sent', 'failed'),
          allowNull: false,
          defaultValue: 'sent'
        },
        error_message: { type: DataTypes.TEXT, allowNull: true },
        template_id: { type: DataTypes.INTEGER, allowNull: true },
        sent_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      { tableName: 'email_history', timestamps: false }
    )
  : null;

export const ScheduledEmail = sequelize
  ? sequelize.define(
      'ScheduledEmail',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        recipients: { type: DataTypes.TEXT, allowNull: false },
        cc: { type: DataTypes.TEXT, allowNull: true },
        bcc: { type: DataTypes.TEXT, allowNull: true },
        subject: { type: DataTypes.TEXT, allowNull: false },
        prompt: { type: DataTypes.TEXT, allowNull: true },
        body: { type: DataTypes.TEXT, allowNull: false },
        send_at: { type: DataTypes.DATE, allowNull: false },
        status: {
          type: DataTypes.ENUM('pending', 'sent', 'failed'),
          allowNull: false,
          defaultValue: 'pending'
        },
        error_message: { type: DataTypes.TEXT, allowNull: true },
        template_id: { type: DataTypes.INTEGER, allowNull: true },
        attachment_meta: { type: DataTypes.JSONB, allowNull: true },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      { tableName: 'scheduled_emails', timestamps: false }
    )
  : null;

export const AppUser = sequelize
  ? sequelize.define(
      'AppUser',
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(120), allowNull: false },
        email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: false }
      },
      {
        tableName: 'app_users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    )
  : null;

if (EmailHistory && EmailTemplate) {
  EmailHistory.belongsTo(EmailTemplate, { foreignKey: 'template_id' });
}

export function isDbConfigured() {
  return Boolean(sequelize && EmailHistory);
}

export async function initDb() {
  if (!sequelize || !EmailHistory) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production');
    }
    return;
  }
  await sequelize.authenticate();
  const alter = process.env.NODE_ENV !== 'production';
  await EmailTemplate.sync({ alter });
  await EmailHistory.sync({ alter });
  if (ScheduledEmail) await ScheduledEmail.sync({ alter });
  if (AppUser) await AppUser.sync({ alter });
  await seedDefaultTemplates();
}

async function seedDefaultTemplates() {
  if (!EmailTemplate) return;
  const count = await EmailTemplate.count();
  if (count > 0) return;

  const defaults = [
    {
      slug: 'interview',
      name: 'Interview',
      category: 'hiring',
      description: 'Interview scheduling / confirmation tone',
      prompt_template:
        'Write a professional email about an interview for {{recipient_name}} at {{company}}. Interview date: {{date}}. Time: {{time}}. Location or meeting details: {{address}}. Keep it clear and polite.'
    },
    {
      slug: 'follow-up',
      name: 'Follow-up',
      category: 'sales',
      description: 'Polite follow-up after meeting or application',
      prompt_template:
        'Write a concise follow-up email to {{recipient_name}} at {{company}}. Context: {{context}}. Reference date: {{date}}. Tone: professional and friendly.'
    },
    {
      slug: 'thank-you',
      name: 'Thank you',
      category: 'general',
      description: 'Gratitude / appreciation',
      prompt_template:
        'Write a thank-you email to {{recipient_name}} for: {{reason}}. Mention {{company}} if relevant. Date of interaction: {{date}}.'
    },
    {
      slug: 'reminder',
      name: 'Reminder',
      category: 'general',
      description: 'Gentle reminder',
      prompt_template:
        'Write a polite reminder email to {{recipient_name}} about: {{topic}}. Due or event date: {{date}}. Time: {{time}}. Additional detail: {{address}}.'
    }
  ];

  await EmailTemplate.bulkCreate(defaults);
}

export async function recordEmailHistory(row) {
  if (!EmailHistory) return;
  await initDb();
  await EmailHistory.create(row);
}

export async function updateHistoryStatus(id, status, error_message) {
  if (!EmailHistory) return;
  await initDb();
  await EmailHistory.update({ status, error_message }, { where: { id } });
}

export { sequelize };
