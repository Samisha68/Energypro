import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]/route';
import User from '../lib/models/User';
import { UserRole } from '../lib/types/models';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method === 'POST') {
    try {
      const { role } = req.body;
      
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      // Now TypeScript knows session.user exists
      const user = await User.findOneAndUpdate(
        { email: session.user.email },
        { role },
        { new: true }
      );
      
      return res.status(200).json({ success: true, user });
    } catch (error) {
      const err = error as Error;
      return res.status(500).json({ error: err.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}