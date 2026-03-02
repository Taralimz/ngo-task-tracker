import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: number
  type: NotificationType
  title: string
  message: string
  link?: string | null
}

/**
 * Create a single notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createNotifications(
  userIds: number[],
  type: NotificationType,
  title: string,
  message: string,
  link?: string | null
) {
  try {
    const uniqueUserIds = [...new Set(userIds)]
    return await prisma.notification.createMany({
      data: uniqueUserIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link: link || null,
      })),
    })
  } catch (error) {
    console.error('Failed to create notifications:', error)
    return null
  }
}

/**
 * Notify all assignees of a task (excluding the actor who triggered the action)
 */
export async function notifyTaskAssignees(
  taskId: number,
  excludeUserId: number,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const assignees = await prisma.taskAssignee.findMany({
      where: { taskId },
      select: { userId: true },
    })

    const userIds = assignees
      .map((a) => a.userId)
      .filter((id) => id !== excludeUserId)

    if (userIds.length === 0) return null

    return await createNotifications(
      userIds,
      type,
      title,
      message,
      link || `/tasks`
    )
  } catch (error) {
    console.error('Failed to notify task assignees:', error)
    return null
  }
}

/**
 * Notify the task creator (if not the actor)
 */
export async function notifyTaskCreator(
  taskId: number,
  excludeUserId: number,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { createdById: true },
    })

    if (!task || task.createdById === excludeUserId) return null

    return await createNotification({
      userId: task.createdById,
      type,
      title,
      message,
      link: link || `/tasks`,
    })
  } catch (error) {
    console.error('Failed to notify task creator:', error)
    return null
  }
}
