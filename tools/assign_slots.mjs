import fs from 'fs';
import path from 'path';

const slotsPath = path.resolve('assets/slots.json');
const tempExhibitsPath = path.resolve('tools/temp_exhibits.json');
const finalExhibitsPath = path.resolve('assets/exhibits.json');

if (!fs.existsSync(tempExhibitsPath) || !fs.existsSync(slotsPath)) {
    console.log('Missing temporary exhibits or slots data. Cannot assign slots.');
    process.exit(0);
}

const slots = JSON.parse(fs.readFileSync(slotsPath, 'utf8'));
const newExhibits = JSON.parse(fs.readFileSync(tempExhibitsPath, 'utf8'));
let existingExhibits = [];

if (fs.existsSync(finalExhibitsPath)) {
    existingExhibits = JSON.parse(fs.readFileSync(finalExhibitsPath, 'utf8'));
}

const finalExhibits = [];
const takenSlots = new Set();

// First, preserve existing slot assignments for models that are still present
for (const existing of existingExhibits) {
    const isStillPresent = newExhibits.some(e => e.id === existing.id);
    if (isStillPresent && existing.slotId) {
        takenSlots.add(existing.slotId);
    }
}

// Now assign slots where necessary
for (const exhibit of newExhibits) {
    const existing = existingExhibits.find(e => e.id === exhibit.id);

    if (existing && existing.slotId) {
        exhibit.slotId = existing.slotId;
        finalExhibits.push(exhibit);
        continue;
    }

    // Find a free slot, optionally matching the preferred wing
    let availableSlot = slots.find(s => !takenSlots.has(s.id) && (!exhibit.wing || s.wing === exhibit.wing));

    // If no slot matching the wing was found, find any free slot
    if (!availableSlot) {
        availableSlot = slots.find(s => !takenSlots.has(s.id));
    }

    if (availableSlot) {
        exhibit.slotId = availableSlot.id;
        takenSlots.add(availableSlot.id);
        console.log(`Assigned '${exhibit.id}' to slot ${availableSlot.id} (${availableSlot.wing})`);
    } else {
        console.warn(`No available slots for exhibit '${exhibit.id}'!`);
    }

    finalExhibits.push(exhibit);
}

fs.writeFileSync(finalExhibitsPath, JSON.stringify(finalExhibits, null, 2));
console.log(`Assigned slots and updated ${finalExhibitsPath}`);

fs.unlinkSync(tempExhibitsPath); // cleanup
