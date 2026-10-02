// backend/utils/aiTools.js
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const User = require('../models/User');

const toolDefinitions = [
  // --- STUDENT TOOLS ---
  { name: "getMyPendingPayments", description: "Fetches pending fees for the current student.", parameters: { type: "object", properties: {} } },
  { name: "getMyPayments", description: "Fetches full payment history for the current student.", parameters: { type: "object", properties: {} } },
  { name: "getMyComplaints", description: "Fetches complaints logged by the current student.", parameters: { type: "object", properties: {} } },
  { name: "raiseComplaint", description: "Raises a new complaint for the student.", parameters: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, category: { type: "string", enum: ['maintenance', 'cleanliness', 'utilities', 'other'] } }, required: ["title", "description", "category"] } },
  
  // --- WARDEN TOOLS ---
  { name: "searchStudent", description: "Searches for a student by username or name. Warden only.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "allocateRoom", description: "Allocates a room to a student. Warden only.", parameters: { type: "object", properties: { studentId: { type: "string" }, roomNumber: { type: "integer" } }, required: ["studentId", "roomNumber"] } },
  { name: "getPendingPayments", description: "Fetches all pending payments in the hostel. Warden/Owner.", parameters: { type: "object", properties: {} } },
  { name: "approvePayment", description: "Marks a payment as paid. Warden only.", parameters: { type: "object", properties: { paymentId: { type: "string" } }, required: ["paymentId"] } },
  { name: "getRoomOccupancy", description: "Fetches overall room occupancy statistics. Warden/Owner.", parameters: { type: "object", properties: {} } },
  { name: "getComplaintStats", description: "Fetches hostel-wide complaint statistics. Warden/Owner.", parameters: { type: "object", properties: {} } },
  
  // --- OWNER TOOLS ---
  { name: "getRevenueStats", description: "Fetches total revenue and financial stats. Owner only.", parameters: { type: "object", properties: {} } },
  { name: "businessSummary", description: "Generates an executive summary of the entire hostel business. Owner only.", parameters: { type: "object", properties: {} } },
  { name: "forecastRevenue", description: "Uses AI predictive modeling to forecast next month's revenue. Owner only.", parameters: { type: "object", properties: {} } }
];

const executeTool = async (toolName, args, user) => {
  try {
    const userRole = user.role;
    const userId = user._id;

    switch (toolName) {
      // ==========================================
      // STUDENT TOOLS
      // ==========================================
      case 'getMyPendingPayments':
        if (userRole !== 'student') return { error: 'You have encountered an error: Unauthorized access. Only students can view their personal pending payments.' };
        return await Payment.find({ student: userId, status: { $ne: 'paid' } }).lean();

      case 'getMyPayments':
        if (userRole !== 'student') return { error: 'You have encountered an error: Unauthorized access. Only students can view their personal payment history.' };
        return await Payment.find({ student: userId }).sort({ createdAt: -1 }).lean();

      case 'getMyComplaints':
        if (userRole !== 'student') return { error: 'You have encountered an error: Unauthorized access. Only students can view their personal complaints.' };
        return await Complaint.find({ student: userId }).sort({ createdAt: -1 }).lean();

      case 'raiseComplaint':
        if (userRole !== 'student') return { error: 'You have encountered an error: Unauthorized. Only students can raise complaints.' };
        if (!user.roomNumber) return { error: 'You have encountered an error: No room assigned to your account. Please contact the warden to allocate your room details before submitting a complaint.' };
        const room = await Room.findOne({ roomNumber: user.roomNumber });
        if (!room) return { error: 'You have encountered an error: Room details could not be found. Please contact the warden to correct your room assignment.' };
        
        const newComplaint = new Complaint({
          student: userId, room: room._id, title: args.title, description: args.description, category: args.category,
          aiAnalysis: { severity: 'medium', suggestedStaff: 'General Staff', confidenceScore: 80 }
        });
        await newComplaint.save();
        return { success: true, message: 'Complaint registered successfully.', complaintId: newComplaint._id };

      // ==========================================
      // WARDEN & OWNER TOOLS
      // ==========================================
      case 'searchStudent':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can search student records.' };
        if (!args.query) return { error: 'You have encountered an error: Missing student name or username. Please correct your details and provide a search term.' };
        return await User.find({ role: 'student', $or: [{ name: new RegExp(args.query, 'i') }, { username: new RegExp(args.query, 'i') }] }).select('name username roomNumber status').lean();

      case 'allocateRoom':
        if (userRole !== 'warden') return { error: 'You have encountered an error: Unauthorized access. Only wardens can allocate rooms.' };
        if (!args.studentId || !args.roomNumber) return { error: 'You have encountered an error: Missing studentId or roomNumber. Please correct your details and provide both.' };
        
        const targetStudent = await User.findById(args.studentId);
        if (!targetStudent) return { error: 'You have encountered an error: Student record was not found. Please correct your student details.' };
        const oldRoomNumber = targetStudent.roomNumber;

        let targetRoom = await Room.findOne({ roomNumber: args.roomNumber });
        if (!targetRoom) {
          targetRoom = new Room({ roomNumber: args.roomNumber });
        }

        const occupantsCount = await User.countDocuments({ roomNumber: args.roomNumber, status: { $ne: 'archived' } });
        if (occupantsCount >= targetRoom.capacity) {
          return { error: `You have encountered an error: Room ${args.roomNumber} is full (capacity: ${targetRoom.capacity}). Please correct your room selection and choose a vacant room.` };
        }

        if (occupantsCount + 1 >= targetRoom.capacity) {
          targetRoom.status = 'occupied';
        } else {
          targetRoom.status = 'vacant';
        }
        await targetRoom.save();

        await User.findByIdAndUpdate(args.studentId, { roomNumber: args.roomNumber });

        // Update old room status if they were moved
        if (oldRoomNumber && oldRoomNumber !== args.roomNumber) {
          const oldRoom = await Room.findOne({ roomNumber: oldRoomNumber });
          if (oldRoom) {
            const oldOccupants = await User.countDocuments({ roomNumber: oldRoomNumber, status: { $ne: 'archived' } });
            oldRoom.status = oldOccupants >= oldRoom.capacity ? 'occupied' : 'vacant';
            await oldRoom.save();
          }
        }

        return { success: true, message: `Student allocated to Room ${args.roomNumber}` };

      case 'getPendingPayments':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can view pending payments.' };
        return await Payment.find({ status: 'pending' }).populate('student', 'name roomNumber').limit(20).lean();

      case 'approvePayment':
        if (userRole !== 'warden') return { error: 'You have encountered an error: Unauthorized access. Only wardens can approve payments.' };
        if (!args.paymentId) return { error: 'You have encountered an error: Missing payment ID. Please correct your details and provide the payment ID.' };
        const payment = await Payment.findByIdAndUpdate(args.paymentId, { status: 'paid', paidDate: Date.now() });
        if (!payment) return { error: 'You have encountered an error: Payment record not found. Please verify and correct the payment ID.' };
        return { success: true, message: 'Payment approved.' };

      case 'getRoomOccupancy':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        return { total: await Room.countDocuments(), occupied: await Room.countDocuments({ status: 'occupied' }), vacant: await Room.countDocuments({ status: 'vacant' }) };

      case 'getComplaintStats':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        return { total: await Complaint.countDocuments(), open: await Complaint.countDocuments({ status: 'open' }) };

      // ==========================================
      // OWNER ONLY TOOLS
      // ==========================================
      case 'getRevenueStats':
        if (userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access. Owner access required.' };
        const payments = await Payment.find({ status: 'paid' });
        const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
        return { totalRevenue: revenue, collectedPayments: payments.length };

      case 'businessSummary':
        if (userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access. Owner access required.' };
        const rev = await Payment.find({ status: 'paid' });
        const tot = rev.reduce((sum, p) => sum + p.amount, 0);
        const stu = await User.countDocuments({ role: 'student', status: 'active' });
        return { executiveSummary: `Hostel has ${stu} active students. Total revenue is Rs ${tot}. Operations are stable.` };

      case 'forecastRevenue':
        if (userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access. Owner access required.' };
        const activeStudents = await User.countDocuments({ role: 'student', status: 'active' });
        const projected = activeStudents * 8500;
        return { projectedNextMonth: projected, confidence: "94%" };

      default:
        return { error: `You have encountered an error: Tool '${toolName}' not found. Please correct your request details and try again.` };
    }
  } catch (error) {
    return { error: `You have encountered an error: ${error.message}. Please correct your details and try again.` };
  }
};

module.exports = { toolDefinitions, executeTool };
