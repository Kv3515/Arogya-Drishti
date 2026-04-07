import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse, parsePagination } from '../utils/response';
import { getRequestId, getParam } from '../utils/params';

/**
 * GET /notifications
 * Returns unread + recent notifications for the authenticated user.
 * Query: ?unread_only=true&page=1&limit=20
 */
export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);
  const unreadOnly = req.query.unread_only === 'true';

  const where: Record<string, unknown> = { recipient_id: user.sub };
  if (unreadOnly) where.is_read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        individual: { select: { service_number: true, name: true } },
      },
    }),
    prisma.notification.count({ where: where as any }),
    prisma.notification.count({ where: { recipient_id: user.sub, is_read: false } }),
  ]);

  res.json({
    success: true,
    data: notifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  });
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
export async function markRead(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;
  const id = getParam(req, 'id');

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    res.status(404).json(errorResponse('Notification not found', 'NOT_FOUND', reqId));
    return;
  }
  if (notification.recipient_id !== user.sub) {
    res.status(403).json(errorResponse('Access denied', 'FORBIDDEN', reqId));
    return;
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { is_read: true, read_at: new Date() },
  });

  res.json(successResponse(updated, reqId));
}

/**
 * PATCH /notifications/read-all
 * Marks all unread notifications for the user as read.
 */
export async function markAllRead(req: AuthRequest, res: Response): Promise<void> {
  const reqId = getRequestId(req);
  const user = req.user!;

  const { count } = await prisma.notification.updateMany({
    where: { recipient_id: user.sub, is_read: false },
    data: { is_read: true, read_at: new Date() },
  });

  res.json(successResponse({ updated: count }, reqId));
}
