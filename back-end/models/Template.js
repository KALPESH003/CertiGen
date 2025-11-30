const mongoose = require('mongoose');

// Sub-schema for layout configuration
// Defines exactly where text appears on the certificate image
const TextConfigSchema = new mongoose.Schema({
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    fontSize: { type: Number, required: true, default: 20 },
    fontFamily: { type: String, default: 'Helvetica' },
    color: { type: String, default: '#000000' },
    align: { type: String, enum: ['left', 'center', 'right'], default: 'center' }
}, { _id: false });

const TemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a template name'],
        unique: true
    },
    // The background image of the certificate (without text)
    backgroundUrl: {
        type: String,
        required: [true, 'Please provide a background image URL']
    },
    // Coordinate Mapping: Where do we print the data?
    layout: {
        recipientName: { type: TextConfigSchema, default: { x: 500, y: 300, fontSize: 40 } },
        courseTitle: { type: TextConfigSchema, default: { x: 500, y: 400, fontSize: 30 } },
        description: { type: TextConfigSchema, default: { x: 500, y: 480, fontSize: 18 } },
        date: { type: TextConfigSchema, default: { x: 200, y: 600, fontSize: 15 } },
        certificateId: { type: TextConfigSchema, default: { x: 800, y: 600, fontSize: 12 } },
        signature: { 
            x: { type: Number, default: 200 }, 
            y: { type: Number, default: 550 },
            width: { type: Number, default: 150 },
            height: { type: Number, default: 50 }
        },
        qrCode: {
             x: { type: Number, default: 800 }, 
             y: { type: Number, default: 500 },
             size: { type: Number, default: 100 }
        }
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Template', TemplateSchema);