const User = require('../models/User');
const Room = require('../models/Room');
const Payment = require('../models/Payment');

/**
 * Generates missing pending payments for all active students.
 * Ensures the system has an up-to-date ledger up to the current month.
 */
const generateMissingPayments = async () => {
  try {
    const activeStudents = await User.find({ role: 'student', status: { $ne: 'archived' } });
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentDate = now.getDate();

    for (let student of activeStudents) {
      let current = new Date(student.createdAt);
      current.setDate(1); // Start of the month they joined
      
      while (current <= now) {
        const monthStr = current.toISOString().slice(0, 7);
        const existing = await Payment.findOne({ student: student._id, month: monthStr });
        
        if (!existing) {
          let roomId = null;
          if (student.roomNumber) {
            const room = await Room.findOne({ roomNumber: student.roomNumber });
            roomId = room ? room._id : null;
          }
          await new Payment({
            student: student._id,
            room: roomId,
            month: monthStr,
            status: 'pending'
          }).save();
        } else if (existing.status === 'pending' && !existing.penaltyWaived) {
          // Check for penalty
          let isLate = false;
          if (existing.month < currentMonth) {
            isLate = true;
          } else if (existing.month === currentMonth && currentDate > 8) {
            isLate = true;
          }

          if (isLate && existing.penaltyAmount === 0) {
            existing.penaltyAmount = 100;
            await existing.save();
          }
        }
        current.setMonth(current.getMonth() + 1);
      }
    }
    console.log('✅ Payment generation & penalty check complete.');
  } catch (error) {
    console.error('❌ Error generating missing payments:', error);
  }
};

module.exports = { generateMissingPayments };
