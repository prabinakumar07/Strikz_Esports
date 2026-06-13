const mongoose = require('mongoose');
const { seedDatabase } = require('../data/seedData');

const modelOptions = {
    strict: false,
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
};

const createModel = (name, collection, idType = String) => {
    const schema = new mongoose.Schema({
        id: { type: idType, unique: true, sparse: true, index: true }
    }, modelOptions);

    schema.set('toJSON', {
        transform: (_doc, ret) => {
            delete ret._id;
            return ret;
        }
    });

    return mongoose.models[name] || mongoose.model(name, schema, collection);
};

const models = {
    User: createModel('User', 'users', Number),
    Setting: createModel('Setting', 'settings', Number),
    Tournament: createModel('Tournament', 'tournaments'),
    Registration: createModel('Registration', 'registrations'),
    RegistrationPlayer: createModel('RegistrationPlayer', 'registration_players', Number),
    Team: createModel('Team', 'teams'),
    TeamMember: createModel('TeamMember', 'team_members', Number),
    News: createModel('News', 'news'),
    Gallery: createModel('Gallery', 'gallery', Number),
    Roster: createModel('Roster', 'roster'),
    Sponsor: createModel('Sponsor', 'sponsors', Number),
    Achievement: createModel('Achievement', 'achievements', Number),
    ChatbotTicket: createModel('ChatbotTicket', 'chatbot_tickets'),
    SocialFeed: createModel('SocialFeed', 'social_feed'),
    Management: createModel('Management', 'management', Number),
    AuditLog: createModel('AuditLog', 'audit_logs', Number)
};

const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGODB_URI is required. Create a MongoDB Atlas database and add its connection string.');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    await seedDatabase(models);

    // Run gamer UID migration for existing users
    try {
        const usersWithoutUid = await models.User.find({ uid: { $exists: false } });
        if (usersWithoutUid.length > 0) {
            console.log(`Migrating ${usersWithoutUid.length} users to generate unique gamer UIDs...`);
            for (const user of usersWithoutUid) {
                let uid;
                let exists = true;
                while (exists) {
                    uid = 'STRIKZ-' + Math.floor(100000 + Math.random() * 900000);
                    exists = await models.User.exists({ uid });
                }
                await models.User.updateOne({ id: user.id }, { $set: { uid } });
            }
            console.log('User gamer UIDs migration complete.');
        }
    } catch (err) {
        console.error('User UID migration failed:', err.message);
    }
};

const nextNumberId = async (Model) => {
    const latest = await Model.findOne({ id: { $type: 'number' } }).sort({ id: -1 }).lean();
    return latest && typeof latest.id === 'number' ? latest.id + 1 : 1;
};

const clean = (doc) => {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = {
    connectDB,
    models,
    nextNumberId,
    clean
};
