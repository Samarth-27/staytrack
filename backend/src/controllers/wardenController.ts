import { Request, Response } from 'express';
import { Room } from '../models/Room';
import { Student } from '../models/Student';

export const getRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find().populate('occupants').lean();

    const roomsFormatted = rooms.map((r: any) => {
      return {
        _id: r._id,
        roomNumber: r.roomNumber,
        capacity: r.capacity,
        // Map occupants to students array with name property expected by frontend
        students: (r.occupants || []).map((o: any) => ({
          name: `${o.firstName} ${o.lastName}`.trim()
        })),
        // Map modern status 'Full'/'Available' to 'occupied'/'vacant' for frontend
        status: r.status === 'Full' || (r.occupants && r.occupants.length >= r.capacity) ? 'occupied' : 'vacant'
      };
    });

    res.json(roomsFormatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find().populate('userId', 'username email').lean();
    
    const studentsFormatted = students.map((s: any) => ({
      _id: s._id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email || (s.userId && s.userId.email),
      username: s.userId && s.userId.username,
      roomId: s.roomId,
      status: s.status,
    }));

    res.json(studentsFormatted);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};
