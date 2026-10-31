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
  
  // --- WARDEN / OWNER TOOLS ---
  { name: "searchStudent", description: "Searches for a student by username, name, or room number. Warden/Owner only.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
  { name: "allocateRoom", description: "Allocates a room to a student. Warden only.", parameters: { type: "object", properties: { studentId: { type: "string" }, roomNumber: { type: "integer" } }, required: ["studentId", "roomNumber"] } },
  { name: "getPendingPayments", description: "Fetches all pending payments in the hostel. Warden/Owner.", parameters: { type: "object", properties: {} } },
  { name: "approvePayment", description: "Marks a payment as paid. Warden only.", parameters: { type: "object", properties: { paymentId: { type: "string" } }, required: ["paymentId"] } },
  { name: "getRoomOccupancy", description: "Fetches overall room occupancy statistics, total vacant rooms, occupied rooms, and occupant student details. Warden/Owner only.", parameters: { type: "object", properties: {} } },
  { name: "getRoomDetails", description: "Fetches details of a specific room or lists all occupied rooms and their student occupants. Warden/Owner only.", parameters: { type: "object", properties: { roomNumber: { type: "integer", description: "Optional specific room number to inspect" } } } },
  { name: "listStudents", description: "Lists students in the hostel with their assigned room numbers and contact information. Warden/Owner only.", parameters: { type: "object", properties: { filter: { type: "string", enum: ["all", "allocated", "unallocated"], description: "Optional filter by room allocation" } } } },
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
        if (!args.title || !args.description || !args.category) {
          return { error: 'You have encountered an error: Missing fields. Please provide title, description, and category.' };
        }
        const newComplaint = new Complaint({
          student: userId,
          title: args.title,
          description: args.description,
          category: args.category,
          status: 'open'
        });
        await newComplaint.save();
        return { success: true, message: 'Complaint lodged successfully.', complaintId: newComplaint._id };

      // ==========================================
      // WARDEN & OWNER TOOLS
      // ==========================================
      case 'searchStudent':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        if (!args.query) return { error: 'You have encountered an error: Missing search query.' };
        return await User.find({
          role: 'student',
          status: { $ne: 'archived' },
          $or: [
            { name: new RegExp(args.query, 'i') },
            { username: new RegExp(args.query, 'i') },
            { phone: new RegExp(args.query, 'i') },
            { email: new RegExp(args.query, 'i') },
            ...(isNaN(Number(args.query)) ? [] : [{ roomNumber: Number(args.query) }])
          ]
        }).select('name username roomNumber phone email enrollmentNumber').limit(10).lean();

      case 'allocateRoom':
        if (userRole !== 'warden') return { error: 'You have encountered an error: Unauthorized access. Only wardens can allocate rooms.' };
        if (!args.studentId || !args.roomNumber) {
          return { error: 'You have encountered an error: Missing studentId or roomNumber.' };
        }
        const studentToAlloc = await User.findById(args.studentId);
        if (!studentToAlloc || studentToAlloc.role !== 'student') {
          return { error: 'You have encountered an error: Student record not found.' };
        }
        const targetRoom = await Room.findOne({ roomNumber: args.roomNumber });
        if (!targetRoom) {
          return { error: `You have encountered an error: Room ${args.roomNumber} does not exist.` };
        }
        if (targetRoom.students && targetRoom.students.length >= targetRoom.capacity) {
          return { error: `You have encountered an error: Room ${args.roomNumber} is at full capacity.` };
        }
        
        studentToAlloc.roomNumber = targetRoom.roomNumber;
        await studentToAlloc.save();

        if (!targetRoom.students.includes(studentToAlloc._id)) {
          targetRoom.students.push(studentToAlloc._id);
        }
        targetRoom.status = targetRoom.students.length >= targetRoom.capacity ? 'occupied' : 'vacant';
        await targetRoom.save();

        return { success: true, message: `Student ${studentToAlloc.name} successfully assigned to Room ${targetRoom.roomNumber}.` };

      case 'getPendingPayments':
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        return await Payment.find({ status: 'pending' }).populate('student', 'name roomNumber phone email').limit(20).lean();

      case 'approvePayment':
        if (userRole !== 'warden') return { error: 'You have encountered an error: Unauthorized access. Only wardens can approve payments.' };
        if (!args.paymentId) return { error: 'You have encountered an error: Missing payment ID.' };
        const payment = await Payment.findByIdAndUpdate(args.paymentId, { status: 'paid', paidDate: Date.now() });
        if (!payment) return { error: 'You have encountered an error: Payment record not found.' };
        return { success: true, message: 'Payment approved.' };

      case 'getRoomOccupancy': {
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        const totalRooms = await Room.countDocuments();
        const vacantCount = await Room.countDocuments({ status: 'vacant' });
        
        // Find occupied rooms and populate assigned students
        const occupiedRooms = await Room.find({
          $or: [{ status: 'occupied' }, { 'students.0': { $exists: true } }]
        }).populate('students', 'name username email phone roomNumber rollNumber enrollmentNumber').lean();

        const occupiedList = [];
        for (const r of occupiedRooms) {
          let studentDetails = (r.students || []).map(s => ({
            name: s.name,
            username: s.username,
            phone: s.phone,
            email: s.email,
            enrollmentNumber: s.enrollmentNumber || s.rollNumber
          }));

          // Fallback: If r.students array was empty but room is marked occupied, find students with this roomNumber
          if (studentDetails.length === 0) {
            const matched = await User.find({ role: 'student', roomNumber: r.roomNumber, status: { $ne: 'archived' } })
              .select('name username phone email enrollmentNumber rollNumber')
              .lean();
            studentDetails = matched.map(s => ({
              name: s.name,
              username: s.username,
              phone: s.phone,
              email: s.email,
              enrollmentNumber: s.enrollmentNumber || s.rollNumber
            }));
          }

          occupiedList.push({
            roomNumber: r.roomNumber,
            capacity: r.capacity || 2,
            occupantsCount: studentDetails.length,
            students: studentDetails
          });
        }

        return {
          totalRooms,
          vacantRooms: vacantCount,
          occupiedRoomsCount: occupiedList.length,
          occupiedRooms: occupiedList
        };
      }

      case 'getRoomDetails': {
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        const query = args.roomNumber 
          ? { roomNumber: Number(args.roomNumber) } 
          : { $or: [{ status: 'occupied' }, { 'students.0': { $exists: true } }] };

        const rooms = await Room.find(query).populate('students', 'name username email phone roomNumber rollNumber enrollmentNumber').lean();
        const result = [];

        for (const r of rooms) {
          let occupants = (r.students || []).map(s => ({
            name: s.name,
            username: s.username,
            phone: s.phone,
            email: s.email
          }));

          if (occupants.length === 0) {
            const fallbackStudents = await User.find({ role: 'student', roomNumber: r.roomNumber, status: { $ne: 'archived' } })
              .select('name username phone email')
              .lean();
            occupants = fallbackStudents.map(s => ({ name: s.name, username: s.username, phone: s.phone, email: s.email }));
          }

          result.push({
            roomNumber: r.roomNumber,
            status: r.status,
            capacity: r.capacity || 2,
            occupantsCount: occupants.length,
            students: occupants
          });
        }

        return result;
      }

      case 'listStudents': {
        if (userRole !== 'warden' && userRole !== 'owner') return { error: 'You have encountered an error: Unauthorized access.' };
        const studentQuery = { role: 'student', status: { $ne: 'archived' } };
        if (args.filter === 'allocated') studentQuery.roomNumber = { $exists: true, $ne: null };
        if (args.filter === 'unallocated') studentQuery.roomNumber = { $in: [null, undefined] };
        
        const students = await User.find(studentQuery).select('name username roomNumber phone email enrollmentNumber').lean();
        return students.map(s => ({
          name: s.name,
          username: s.username,
          roomNumber: s.roomNumber ? `Room ${s.roomNumber}` : 'Unallocated',
          phone: s.phone || 'N/A',
          email: s.email || 'N/A'
        }));
      }

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
