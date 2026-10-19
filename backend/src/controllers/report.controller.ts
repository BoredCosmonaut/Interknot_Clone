import type { Request, Response } from 'express';
import {
  createReprot,
  getReports,
  resolveReport,
  type ReportTarget,
  type ReportStatus,
} from '../models/report.model.js';
import { getPostById } from '../models/post.model.js';
import { getCommentById } from '../models/comment.model.js';
import { getMessageById } from '../models/message.model.js';
import { findPublicUserById } from '../models/user.model.js';

const TARGETS: ReportTarget[] = ['post', 'comment', 'message', 'user'];
const REASONS = ['spam', 'harassment', 'inappropriate', 'other'];

interface Snapshot {
  text: string;
  image: string | null;
  ownerId: number;
}

async function snapshotFor(
  type: ReportTarget,
  id: number,
  reporterId: number,
): Promise<Snapshot | null | false> {
  switch (type) {
    case 'post': {
    const p = await getPostById(id);
    return p
        ? { text: `${p.title}\n\n${p.content}`, image: p.image_url, ownerId: p.author_id }
        : null;
    }
    case 'comment': {
    const c = await getCommentById(id);
    return c ? { text: c.content, image: null, ownerId: c.author_id } : null;
    }
    case 'user': {
    const u = await findPublicUserById(id);
    return u
        ? { text: `${u.display_name} (@${u.username})\n${u.bio ?? ''}`, image: u.avatar_url, ownerId: u.id }
        : null;
    }
    case 'message': {
    const m = await getMessageById(id);
    if (!m) return null;
    if (m.recipient_id !== reporterId) return false;
    return { text: m.content, image: null, ownerId: m.sender_id };
    }
  }
}

export async function create(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const { target_type, target_id, reason, details } = req.body ?? {};
  const targetId = Number(target_id);

  if (!TARGETS.includes(target_type)) {
    return res.status(400).json({ error: 'Invalid report type' });
  }

  if (!Number.isInteger(targetId) || targetId < 1) {
    return res.status(400).json({ error: 'Invalid target id' });
  }

  if (!REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  if (details !== undefined && (typeof details !== 'string' || details.length > 500)) {
    return res.status(400).json({ error: 'Details must be under 500 characters' });
  }

  if (target_type === 'user' && targetId === req.user.userId) {
    return res.status(400).json({ error: 'You cannot report yourself' });
  }

  try {
    const snapshot = await snapshotFor(target_type, targetId, req.user.userId);

    if (snapshot === null) {
      return res.status(404).json({ error: 'Content no longer exists' });
    }

    if (snapshot === false) {
      return res.status(403).json({ error: 'You can only report messages sent to you' });
    }

    const report = await createReprot(
      req.user.userId,
      target_type,
      targetId,
      reason,
      details?.trim() || null,
      snapshot.text,
      snapshot.image,
      snapshot.ownerId
    );

    return res.status(201).json(report);
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === '23505') {
      return res.status(409).json({ error: 'You already reported this' });
    }
    console.error('create report failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

export async function list(req: Request, res: Response) {
  const status = (req.query.status ?? 'open') as ReportStatus;

  if (!['open', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const reports = await getReports(status);
    return res.json(reports);
  } catch (err) {
    console.error('list reports failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

export async function resolve(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid report id' });
  }

  if (status !== 'resolved' && status !== 'dismissed') {
    return res.status(400).json({ error: 'Status must be resolved or dismissed' });
  }

  try {
    const report = await resolveReport(id, req.user.userId, status);

    if (!report) {
      return res.status(404).json({ error: 'Report not found or already handled' });
    }

    return res.json(report);
  } catch (err) {
    console.error('resolve report failed:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}