// backend/utils/aiTools.js
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const User = require('../models/User');
const Poll = require('../models/Poll');

const toolDefinitions = [
  // ==========================================
  // STUDENT & GENERAL TOOLS
  // ==========================================
  { 
    name: "getMyPendingPayments", 
    description: "Fetches pending fees for the current student.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "getMyPayments", 
    description: "Fetches full personal payment history for the current student.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "getMyComplaints", 
    description: "Fetches personal complaints logged by the current student.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "raiseComplaint", 
    description: "Raises a new complaint for the student.", 
    parameters: { 
      type: "object", 
      properties: { 
        title: { type: "string" }, 
        description: { type: "string" }, 
        category: { type: "string", enum: ['maintenance', 'cleanliness', 'utilities', 'other'] } 
      }, 
      required: ["title", "description", "category"] 
    } 
  },
  {
    name: "getActivePolls",
    description: "Fetches active hostel service announcement polls (e.g. plumber, electrician, housekeeping visits). Available to all users.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "votePoll",
    description: "Submits student response or repair request to an active service poll (e.g. confirming if room needs the visiting plumber or electrician). Student only.",
    parameters: {
      type: "object",
      properties: {
        pollId: { type: "string", description: "Optional specific poll ID" },
        category: { type: "string", description: "Optional category (e.g., 'plumber', 'electrician')" },
        selectedOption: { type: "string", description: "Selected option, e.g. 'Yes (Need repair)' or 'No (All good)'" },
        issueDetails: { type: "string", description: "Optional details of repair needed (e.g. leaking tap in bathroom)" }
      },
      required: ["selectedOption"]
    }
  },
  
  // ==========================================
  // WARDEN & OWNER TOOLS
  // ==========================================
  { 
    name: "searchStudent", 
    description: "Searches for a student by username, name, or room number. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { query: { type: "string" } }, 
      required: ["query"] 
    } 
  },
  { 
    name: "allocateRoom", 
    description: "Allocates a room to a student. Warden only.", 
    parameters: { 
      type: "object", 
      properties: { studentId: { type: "string" }, roomNumber: { type: "integer" } }, 
      required: ["studentId", "roomNumber"] 
    } 
  },
  { 
    name: "getPendingPayments", 
    description: "Fetches all pending, unverified, or overdue student payments in the hostel. Warden/Owner only.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "getPaidPayments", 
    description: "Fetches the list of students who have paid their hostel fees, with room numbers, amounts, payment modes, and dates. Can filter by billing month (YYYY-MM) or student name. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        month: { type: "string", description: "Optional month filter in YYYY-MM format (e.g., '2026-10')" },
        studentName: { type: "string", description: "Optional student name to filter" }
      } 
    } 
  },
  { 
    name: "getPaymentReport", 
    description: "Generates an aggregated hostel payment summary and fee collection report (total collected, total pending, collection rate percentage, paid student list, and pending student list). Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        month: { type: "string", description: "Optional month filter in YYYY-MM format (e.g., '2026-10')" }
      } 
    } 
  },
  { 
    name: "approvePayment", 
    description: "Marks a student payment as paid. Warden only.", 
    parameters: { 
      type: "object", 
      properties: { paymentId: { type: "string" } }, 
      required: ["paymentId"] 
    } 
  },
  { 
    name: "createPoll", 
    description: "Creates an official service or maintenance dispatch poll for hostel students (e.g. plumber visit today, electrician, carpenter, AC repair, cleaning, fee reminders). Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        title: { type: "string", description: "Title of the poll (e.g., 'Plumber Service Visit Today')" },
        category: { 
          type: "string", 
          enum: ["plumber", "electrician", "carpenter", "ac_repair", "cleaning", "payment_reminder", "general"],
          description: "Category of the service" 
        },
        description: { type: "string", description: "Instructions or details for students" },
        scheduledDate: { type: "string", description: "Optional scheduled date of service (YYYY-MM-DD or ISO date)" },
        options: { 
          type: "array", 
          items: { type: "string" }, 
          description: "Poll options (default: ['Yes (Need repair)', 'No (All good)'])" 
        }
      },
      required: ["title"]
    } 
  },
  { 
    name: "getPollResults", 
    description: "Fetches voting results and list of specific rooms/students requesting repair or inspection for a service poll. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        pollId: { type: "string", description: "Optional poll ID" },
        category: { type: "string", description: "Optional category filter (e.g. 'plumber', 'electrician')" }
      } 
    } 
  },
  { 
    name: "closePoll", 
    description: "Closes an active service poll so students can no longer vote. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        pollId: { type: "string", description: "Optional poll ID" },
        category: { type: "string", description: "Optional category filter" }
      } 
    } 
  },
  { 
    name: "getRoomOccupancy", 
    description: "Fetches overall room occupancy statistics, total vacant rooms, occupied rooms, and occupant student details. Warden/Owner only.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "getRoomDetails", 
    description: "Fetches details of a specific room or lists all occupied rooms and their student occupants. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        roomNumber: { type: "integer", description: "Optional specific room number to inspect" } 
      } 
    } 
  },
  { 
    name: "listStudents", 
    description: "Lists students in the hostel with their assigned room numbers and contact information. Warden/Owner only.", 
    parameters: { 
      type: "object", 
      properties: { 
        filter: { type: "string", enum: ["all", "allocated", "unallocated"], description: "Optional filter by room allocation" } 
      } 
    } 
  },
  { 
    name: "getComplaintStats", 
    description: "Fetches hostel-wide complaint statistics. Warden/Owner.", 
    parameters: { type: "object", properties: {} } 
  },
  
  // ==========================================
  // OWNER ONLY TOOLS
  // ==========================================
  { 
    name: "getRevenueStats", 
    description: "Fetches total revenue and financial stats. Owner only.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "businessSummary", 
    description: "Generates an executive summary of the entire hostel business. Owner only.", 
    parameters: { type: "object", properties: {} } 
  },
  { 
    name: "forecastRevenue", 
    description: "Uses AI predictive modeling to forecast next month's revenue. Owner only.", 
    parameters: { type: "object", properties: {} } 
  }
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

      case 'getActivePolls': {
        const polls = await Poll.find({ status: 'active' }).sort({ createdAt: -1 }).lean();
        if (polls.length === 0) {
          return { message: 'There are currently no active service polls or announcements in the hostel.' };
        }
        return polls.map(p => ({
          pollId: p._id,
          title: p.title,
          category: p.category,
          description: p.description,
          options: p.options,
          totalResponses: (p.responses || []).length,
          scheduledDate: p.scheduledDate ? new Date(p.scheduledDate).toLocaleDateString('en-IN') : 'Scheduled'
        }));
      }

      case 'votePoll': {
        if (userRole !== 'student') {
          return { error: 'You have encountered an error: Only students can vote or respond to service polls.' };
        }
        let pollQuery = { status: 'active' };
        if (args.pollId) pollQuery._id = args.pollId;
        else if (args.category) pollQuery.category = args.category;

        const poll = await Poll.findOne(pollQuery).sort({ createdAt: -1 });
        if (!poll) {
          return { error: 'You have encountered an error: No active service poll found matching your request.' };
        }

        const selectedOption = args.selectedOption || 'Yes (Need repair)';
        const issueDetails = (args.issueDetails || '').trim();

        const existingIdx = poll.responses.findIndex(r => r.student && r.student.toString() === userId.toString());
        const responseData = {
          student: userId,
          studentName: user.name,
          roomNumber: user.roomNumber,
          selectedOption,
          issueDetails,
          respondedAt: new Date()
        };

        if (existingIdx > -1) {
          poll.responses[existingIdx] = responseData;
        } else {
          poll.responses.push(responseData);
        }

        await poll.save();
        return { 
          success: true, 
          message: `Your response for "${poll.title}" has been recorded. Selected: "${selectedOption}".`,
          pollTitle: poll.title,
          selectedOption
        };
      }

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
        }).select('name username roomNumber phone email enrollmentNumber rollNumber').limit(10).lean();

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
        return await Payment.find({ status: { $in: ['pending', 'pending_verification', 'overdue'] } })
          .populate('student', 'name username roomNumber phone email enrollmentNumber')
          .sort({ createdAt: -1 })
          .limit(30)
          .lean();

      case 'getPaidPayments': {
        if (userRole !== 'warden' && userRole !== 'owner') {
          return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can view paid payments.' };
        }

        const query = { status: 'paid' };
        if (args.month) {
          query.month = args.month;
        }

        let payments = await Payment.find(query)
          .populate('student', 'name username roomNumber phone email enrollmentNumber rollNumber')
          .populate('room', 'roomNumber')
          .sort({ paidDate: -1, createdAt: -1 })
          .lean();

        if (args.studentName) {
          const filterRegex = new RegExp(args.studentName, 'i');
          payments = payments.filter(p => p.student && filterRegex.test(p.student.name));
        }

        const formattedList = payments.map(p => {
          const s = p.student || {};
          const rNumber = s.roomNumber ? `Room ${s.roomNumber}` : (p.room?.roomNumber ? `Room ${p.room.roomNumber}` : 'Unassigned');
          
          let mode = 'Online';
          if (p.onlineAmount > 0 && p.cashAmount > 0) {
            mode = `Online (₹${p.onlineAmount}) + Cash (₹${p.cashAmount})`;
          } else if (p.cashAmount > 0) {
            mode = `Cash (₹${p.cashAmount})`;
          } else if (p.onlineAmount > 0) {
            mode = `Online (₹${p.onlineAmount})`;
          }

          return {
            studentName: s.name || 'Unknown Student',
            username: s.username || 'N/A',
            roomNumber: rNumber,
            amountPaid: p.amount || 8500,
            billingMonth: p.month,
            paymentMode: mode,
            paidDate: p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : 'Verified',
            reference: p.transactionId || p.rentTransactionId || p.messTransactionId || 'Settled'
          };
        });

        const totalCollected = formattedList.reduce((sum, item) => sum + (item.amountPaid || 0), 0);

        return {
          totalPaidStudents: formattedList.length,
          totalAmountCollected: totalCollected,
          month: args.month || 'All Months',
          paidStudents: formattedList
        };
      }

      case 'getPaymentReport': {
        if (userRole !== 'warden' && userRole !== 'owner') {
          return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can view payment reports.' };
        }

        const filter = args.month ? { month: args.month } : {};
        const payments = await Payment.find(filter)
          .populate('student', 'name username roomNumber phone email enrollmentNumber')
          .sort({ createdAt: -1 })
          .lean();

        let totalCollected = 0;
        let totalPending = 0;
        let totalOverdue = 0;
        const paidStudents = [];
        const pendingStudents = [];
        const verificationPendingStudents = [];

        payments.forEach(p => {
          const s = p.student || {};
          const rNum = s.roomNumber ? `Room ${s.roomNumber}` : 'Unassigned';
          const info = {
            studentName: s.name || 'Unknown Student',
            username: s.username || 'N/A',
            roomNumber: rNum,
            amount: p.amount || 8500,
            month: p.month,
            status: p.status,
            paidDate: p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN') : null
          };

          if (p.status === 'paid') {
            totalCollected += (p.amount || 0);
            paidStudents.push(info);
          } else if (p.status === 'pending_verification') {
            totalPending += (p.amount || 0);
            verificationPendingStudents.push(info);
          } else if (p.status === 'overdue') {
            totalOverdue += (p.amount || 0);
            pendingStudents.push(info);
          } else {
            totalPending += (p.amount || 0);
            pendingStudents.push(info);
          }
        });

        const collectionRate = payments.length > 0 
          ? `${Math.round((paidStudents.length / payments.length) * 100)}%`
          : '0%';

        return {
          billingMonth: args.month || 'All Records',
          summary: {
            totalBilledRecords: payments.length,
            paidCount: paidStudents.length,
            pendingCount: pendingStudents.length,
            pendingVerificationCount: verificationPendingStudents.length,
            totalCollectedAmount: totalCollected,
            totalPendingAmount: totalPending + totalOverdue,
            collectionRate
          },
          paidStudents: paidStudents.slice(0, 25),
          pendingStudents: pendingStudents.slice(0, 25),
          awaitingVerification: verificationPendingStudents.slice(0, 10)
        };
      }

      case 'approvePayment':
        if (userRole !== 'warden') return { error: 'You have encountered an error: Unauthorized access. Only wardens can approve payments.' };
        if (!args.paymentId) return { error: 'You have encountered an error: Missing payment ID.' };
        const payment = await Payment.findByIdAndUpdate(args.paymentId, { status: 'paid', paidDate: Date.now() });
        if (!payment) return { error: 'You have encountered an error: Payment record not found.' };
        return { success: true, message: 'Payment approved.' };

      case 'createPoll': {
        if (userRole !== 'warden' && userRole !== 'owner') {
          return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can create polls.' };
        }

        let title = (args.title || '').trim();
        const rawInput = `${title} ${args.category || ''} ${args.description || ''}`.toLowerCase();

        // Robust category inference & normalization (handles typos like "plumer")
        let category = 'general';
        if (rawInput.includes('plumb') || rawInput.includes('plumer') || rawInput.includes('water') || rawInput.includes('leak') || rawInput.includes('tap') || rawInput.includes('pipe')) {
          category = 'plumber';
        } else if (rawInput.includes('elect') || rawInput.includes('light') || rawInput.includes('switch') || rawInput.includes('fan') || rawInput.includes('wire')) {
          category = 'electrician';
        } else if (rawInput.includes('carpent') || rawInput.includes('door') || rawInput.includes('wood') || rawInput.includes('lock') || rawInput.includes('window') || rawInput.includes('bed') || rawInput.includes('cupboard')) {
          category = 'carpenter';
        } else if (rawInput.includes('ac') || rawInput.includes('air cond') || rawInput.includes('cooling')) {
          category = 'ac_repair';
        } else if (rawInput.includes('clean') || rawInput.includes('sweep') || rawInput.includes('mopping') || rawInput.includes('trash') || rawInput.includes('maid') || rawInput.includes('housekeep')) {
          category = 'cleaning';
        } else if (rawInput.includes('pay') || rawInput.includes('fee') || rawInput.includes('rent') || rawInput.includes('dues')) {
          category = 'payment_reminder';
        } else if (['plumber', 'electrician', 'carpenter', 'ac_repair', 'cleaning', 'payment_reminder', 'general'].includes((args.category || '').toLowerCase())) {
          category = (args.category || '').toLowerCase();
        }

        if (!title) {
          const categoryDisplayNames = {
            plumber: 'Plumber Service Visit',
            electrician: 'Electrician Maintenance Visit',
            carpenter: 'Carpenter Repair Visit',
            ac_repair: 'AC Servicing & Maintenance',
            cleaning: 'Hostel Deep Cleaning Service',
            payment_reminder: 'Monthly Fee Payment Reminder',
            general: 'Hostel Service Announcement'
          };
          title = `${categoryDisplayNames[category] || 'Hostel Service Visit'} - ${new Date().toLocaleDateString('en-IN')}`;
        }

        const defaultDescriptions = {
          plumber: 'The hostel plumber is visiting today. Please indicate whether your room or bathroom has plumbing issues (leaking taps, pipe blockage, flush repair, shower head) so repairs can be scheduled.',
          electrician: 'The hostel electrician is visiting today. Please indicate if your room has electrical issues (lights, fans, switchboards, wiring) needing inspection.',
          carpenter: 'The hostel carpenter is on campus today. Please indicate if you have issues with doors, cupboards, beds, or windows.',
          ac_repair: 'AC servicing is scheduled. Please report if your room air conditioner needs maintenance or repair.',
          cleaning: 'Housekeeping team is conducting room cleaning. Please confirm if your room is ready for cleaning.',
          payment_reminder: 'Gentle reminder to settle monthly hostel accommodation and mess fees.',
          general: 'Hostel service announcement. Please submit your response.'
        };

        const description = (args.description || '').trim() || defaultDescriptions[category] || 'Please confirm if your room requires maintenance.';

        let scheduledDate = new Date();
        if (args.scheduledDate) {
          const parsed = new Date(args.scheduledDate);
          if (!isNaN(parsed.getTime())) scheduledDate = parsed;
        }

        const options = (Array.isArray(args.options) && args.options.length > 0)
          ? args.options
          : ['Yes (Need repair)', 'No (All good)'];

        const poll = new Poll({
          title,
          category,
          description,
          scheduledDate,
          createdBy: userId,
          options,
          status: 'active'
        });

        await poll.save();

        return {
          success: true,
          message: `Poll "${poll.title}" created successfully and published to all hostel students.`,
          pollId: poll._id,
          title: poll.title,
          category: poll.category,
          description: poll.description,
          options: poll.options,
          scheduledDate: poll.scheduledDate ? poll.scheduledDate.toLocaleDateString('en-IN') : 'Today',
          status: poll.status
        };
      }

      case 'getPollResults': {
        if (userRole !== 'warden' && userRole !== 'owner') {
          return { error: 'You have encountered an error: Unauthorized access. Only wardens and owners can view poll results.' };
        }

        let pollQuery = {};
        if (args.pollId) {
          pollQuery._id = args.pollId;
        } else if (args.category) {
          pollQuery.category = args.category;
        }

        const poll = await Poll.findOne(pollQuery).sort({ createdAt: -1 }).lean();
        if (!poll) {
          return { error: 'You have encountered an error: No service poll found matching your query.' };
        }

        const optionCounts = {};
        (poll.options || []).forEach(opt => { optionCounts[opt] = 0; });
        
        const roomsNeedingService = [];
        (poll.responses || []).forEach(r => {
          optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] || 0) + 1;
          const optLower = (r.selectedOption || '').toLowerCase();
          if (optLower.startsWith('yes') || optLower.includes('repair') || optLower.includes('need')) {
            roomsNeedingService.push({
              roomNumber: r.roomNumber ? `Room ${r.roomNumber}` : 'Unassigned',
              studentName: r.studentName,
              issueDetails: r.issueDetails || 'Needs inspection',
              respondedAt: r.respondedAt ? new Date(r.respondedAt).toLocaleString('en-IN') : 'Recorded'
            });
          }
        });

        return {
          pollId: poll._id,
          title: poll.title,
          category: poll.category,
          status: poll.status,
          totalResponses: (poll.responses || []).length,
          voteSummary: optionCounts,
          roomsNeedingService
        };
      }

      case 'closePoll': {
        if (userRole !== 'warden' && userRole !== 'owner') {
          return { error: 'You have encountered an error: Unauthorized access.' };
        }
        let pollQuery = {};
        if (args.pollId) pollQuery._id = args.pollId;
        else if (args.category) pollQuery.category = args.category;

        const poll = await Poll.findOneAndUpdate(pollQuery, { status: 'closed' }, { sort: { createdAt: -1 }, new: true });
        if (!poll) return { error: 'You have encountered an error: Poll not found.' };
        return { success: true, message: `Poll "${poll.title}" has been closed.` };
      }

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
